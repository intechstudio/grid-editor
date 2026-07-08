import { type LuaTable } from "../../../serialport/evaluate-parser";
import { type GridModule } from "../../../runtime/runtime";

export type DirEntry = { name: string; type: "file" | "dir" };

export function pageNumberToFolderPath(pageNumber: number): string {
  return `/${pageNumber.toString(16).padStart(2, "0").toUpperCase()}/`;
}

function luaEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\0/g, "\\0")
    .replace(/[\x01-\x1f\x7f-\xff]/g, (c) => `\\${c.charCodeAt(0)}`);
}

export async function writeFileContent(
  path: string,
  content: string,
  module: GridModule,
  chunkSize: number,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const tmpPath = path + ".tmp";
  const expectedSize = content.length;

  const rawChunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    rawChunks.push(content.slice(i, i + chunkSize));
  }
  if (rawChunks.length === 0) rawChunks.push("");

  for (let i = 0; i < rawChunks.length; i++) {
    const mode = i === 0 ? "w" : "a";
    const escaped = luaEscape(rawChunks[i]);
    const lua = `local f=io.open(${JSON.stringify(tmpPath)},"${mode}") if not f then return false end f:write("${escaped}") f:close() collectgarbage("collect") return true`;
    const result = await module.execLUAImmediateAndEvalaute(lua, false);
    if (result[0] !== true) {
      throw new Error(`Write failed at chunk ${i + 1}/${rawChunks.length}`);
    }
    onProgress?.(i + 1, rawChunks.length);
  }

  const renameResult = await module.execLUAImmediateAndEvalaute(
    `return os.rename(${JSON.stringify(tmpPath)}, ${JSON.stringify(path)})`,
  );
  if (renameResult[0] !== true) {
    throw new Error(`Rename failed: ${String(renameResult[1] ?? "unknown")}`);
  }

  const sizeResult = await module.execLUAImmediateAndEvalaute(
    `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end local n=0 local c=f:read(256) while c do n=n+#c c=f:read(256) end f:close() return n`,
  );
  if (sizeResult[0] !== expectedSize) {
    throw new Error(
      `Size mismatch: expected ${expectedSize} B, got ${sizeResult[0]} B`,
    );
  }
}

export async function invalidateLuaModule(
  moduleName: string,
  module: GridModule,
): Promise<void> {
  await module.execLUAImmediateAndEvalaute(
    `package.loaded[${JSON.stringify(moduleName)}] = nil`,
  );
}

export async function fetchFileContent(
  path: string,
  module: GridModule,
  chunkSize: number,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  const sizeResult = await module.execLUAImmediateAndEvalaute(
    `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end local n=0 local c=f:read(256) while c do n=n+#c c=f:read(256) end f:close() return n`,
  );
  if (sizeResult[0] == null) {
    throw new Error("Could not read file size");
  }
  const fileSize = Number(sizeResult[0]);
  let assembled = "";
  if (fileSize > 0) {
    const totalChunks = Math.ceil(fileSize / chunkSize);
    for (let i = 0; i < totalChunks; i++) {
      const offset = i * chunkSize;
      const result = await module.execLUAImmediateAndEvalaute(
        `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end f:seek("set",${offset}) local c=f:read(${chunkSize}) f:close() collectgarbage("collect") return c`,
        false,
      );
      if (result[0] == null) {
        throw new Error(`Read failed at chunk ${i + 1}/${totalChunks}`);
      }
      assembled += String(result[0]);
      onProgress?.(i + 1, totalChunks);
    }
  }
  return assembled;
}

export async function createFile(
  path: string,
  module: GridModule,
): Promise<void> {
  const result = await module.execLUAImmediateAndEvalaute(
    `local f=io.open(${JSON.stringify(path)},"w") if not f then return false end f:close() return true`,
  );
  if (result[0] !== true) {
    throw new Error("Failed to create file.");
  }
}

export async function createDir(
  path: string,
  module: GridModule,
): Promise<void> {
  const result = await module.execLUAImmediateAndEvalaute(
    `return dirent.mkdir(${JSON.stringify(path)})`,
  );
  if (result[0] !== true) {
    throw new Error(
      `Failed to create folder: ${String(result[1] ?? "unknown error")}`,
    );
  }
}

export async function renameEntry(
  oldPath: string,
  newPath: string,
  module: GridModule,
): Promise<void> {
  const result = await module.execLUAImmediateAndEvalaute(
    `return os.rename(${JSON.stringify(oldPath)}, ${JSON.stringify(newPath)})`,
  );
  if (result[0] !== true) {
    throw new Error(`Rename failed: ${String(result[1] ?? "unknown error")}`);
  }
}

export async function copyFile(
  srcPath: string,
  dstPath: string,
  module: GridModule,
): Promise<void> {
  const lua = `local s=io.open(${JSON.stringify(srcPath)},"r") if not s then return false,"open src failed" end local d=io.open(${JSON.stringify(dstPath)},"w") if not d then s:close() return false,"open dst failed" end local c=s:read(256) while c do d:write(c) c=s:read(256) end s:close() d:close() return true`;
  const result = await module.execLUAImmediateAndEvalaute(lua);
  if (result[0] !== true) {
    throw new Error(`Copy failed: ${String(result[1] ?? "unknown error")}`);
  }
}

export async function deleteFile(
  path: string,
  module: GridModule,
): Promise<void> {
  const result = await module.execLUAImmediateAndEvalaute(
    `return os.remove(${JSON.stringify(path)})`,
  );
  if (result[0] !== true) {
    throw new Error(`Delete failed: ${String(result[1] ?? "unknown error")}`);
  }
}

/**
 * Max characters of entry names per response chunk.
 * Tune to your hardware's transmit limit, leaving headroom for
 * serialization overhead (brackets, type numbers, framing).
 */
const PAGE_CHAR_BUDGET = 256;

/** Rough per-entry serialization overhead (type field, separators). */
const PER_ENTRY_OVERHEAD = 8;

export async function fetchDirEntries(
  path: string,
  module: GridModule,
): Promise<DirEntry[]> {
  const entries: DirEntry[] = [];
  let start = 1; // Lua is 1-indexed

  while (true) {
    const script =
      `local t,e=dirent.list(${JSON.stringify(path)}) ` +
      `if not t then return nil,e end ` +
      `table.sort(t,function(a,b) return a[1]<b[1] end) ` +
      `local o,l,i={},0,${start} ` +
      `while i<=#t do ` +
      `local c=#t[i][1]+${PER_ENTRY_OVERHEAD} ` +
      `if l+c>${PAGE_CHAR_BUDGET} then break end ` +
      `o[#o+1]=t[i] l=l+c i=i+1 ` +
      `end ` +
      `return i,o`;

    const result = await module.execLUAImmediateAndEvalaute(script);

    const nextIndex = result[0] as number | null;

    if (nextIndex === null || typeof nextIndex !== "number") {
      throw new Error(
        `Failed to list directory: ${String(result[1] ?? "unknown error")}`,
      );
    }

    const table = result[1] as LuaTable;
    const rows = Object.values(table ?? {});

    if (rows.length === 0) {
      if (nextIndex <= start) {
        // Cursor didn't advance and nothing was packed: either we're past
        // the end (done) or a single name exceeds the budget (stuck).
        if (nextIndex === start && start === 1) {
          // empty directory
          break;
        }
        break;
      }
      break;
    }

    for (const v of rows) {
      const row = v as LuaTable;
      entries.push({
        name: String(row[1]),
        type: row[2] === 2 ? "dir" : "file",
      } as DirEntry);
    }

    // Safety: a lone entry longer than the budget would never advance.
    if (nextIndex <= start) {
      throw new Error(
        `Entry at index ${start} in "${path}" exceeds ${PAGE_CHAR_BUDGET}-char page budget`,
      );
    }

    start = nextIndex;
  }

  return entries;
}

export async function clearDirFiles(
  path: string,
  module: GridModule,
): Promise<void> {
  let entries: DirEntry[];
  try {
    entries = await fetchDirEntries(path, module);
  } catch {
    // Directory doesn't exist yet — nothing to clear
    return;
  }
  for (const entry of entries) {
    if (entry.type !== "file") continue;
    const filePath = path.endsWith("/")
      ? `${path}${entry.name}`
      : `${path}/${entry.name}`;
    await module.execLUAImmediateAndEvalaute(
      `return os.remove(${JSON.stringify(filePath)})`,
    );
  }
}
