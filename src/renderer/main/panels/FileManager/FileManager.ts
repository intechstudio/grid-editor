import {
  parseEvaluateResponse,
  type LuaValue,
  type LuaTable,
} from "../../../serialport/evaluate-parser";
import { runtime_manager } from "../../../runtime/runtime-manager.store";
import { grid, GridScript } from "@intechstudio/grid-protocol";
import {
  InstructionClassName,
  InstructionClass,
} from "../../../runtime/engine.store";
import { get } from "svelte/store";

export type DirEntry = { name: string; type: "file" | "dir" };

async function sendLua(
  code: string,
  dx: number,
  dy: number,
  compress = true,
): Promise<LuaValue[]> {
  const runtime = get(runtime_manager).active?.runtime;
  if (!runtime) throw new Error("No runtime");

  const script = `${compress ? GridScript.compressScript(code) : code}`;
  const size = script.length.toString(16).padStart(4, "0");
  const classBody = `\x02086e0001` + `04` + size + script + `\x03`;
  const classArray: number[] = Array.from(classBody, (c) => c.charCodeAt(0));
  classArray.push(0x04);

  const dummyDescr = {
    brc_parameters: { DX: dx, DY: dy },
    class_name: InstructionClassName.IMMEDIATE,
    class_instr: InstructionClass.EXECUTE,
    class_parameters: { ACTIONLENGTH: 0, ACTIONSTRING: "" },
  };
  const encoded = grid.encode_packet(dummyDescr);
  if (!encoded) throw new Error("Packet encode failed");

  const brcHeader: number[] = encoded.serial.slice(0, 23);
  const messageArray: number[] = [...brcHeader, ...classArray];

  const lenHex = messageArray.length.toString(16).padStart(4, "0");
  for (let i = 0; i < 4; i++) {
    messageArray[2 + i] = lenHex.charCodeAt(i);
  }

  const checksum = messageArray.reduce((a, b) => a ^ b);
  const checksumHex = checksum.toString(16).padStart(2, "0");
  messageArray.push(checksumHex.charCodeAt(0));
  messageArray.push(checksumHex.charCodeAt(1));
  messageArray.push(10);

  const descr = await runtime.connection.buffer.sendRawDataToGrid(
    new Uint8Array(messageArray),
    {
      dx,
      dy,
      responseRequired: true,
      filter: {
        class_name: "EVALUATE",
        brc_parameters: {},
        class_parameters: {},
      },
      responseTimeout: 5000,
    },
  );
  return parseEvaluateResponse(descr);
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
  dx: number,
  dy: number,
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
    const result = await sendLua(lua, dx, dy, false);
    if (result[0] !== true) {
      throw new Error(`Write failed at chunk ${i + 1}/${rawChunks.length}`);
    }
    onProgress?.(i + 1, rawChunks.length);
  }

  const renameResult = await sendLua(
    `return os.rename(${JSON.stringify(tmpPath)}, ${JSON.stringify(path)})`,
    dx,
    dy,
  );
  if (renameResult[0] !== true) {
    throw new Error(`Rename failed: ${String(renameResult[1] ?? "unknown")}`);
  }

  const sizeResult = await sendLua(
    `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end local n=0 local c=f:read(256) while c do n=n+#c c=f:read(256) end f:close() return n`,
    dx,
    dy,
  );
  if (sizeResult[0] !== expectedSize) {
    throw new Error(
      `Size mismatch: expected ${expectedSize} B, got ${sizeResult[0]} B`,
    );
  }
}

export async function invalidateLuaModule(
  moduleName: string,
  dx: number,
  dy: number,
): Promise<void> {
  await sendLua(`package.loaded[${JSON.stringify(moduleName)}] = nil`, dx, dy);
}

export async function fetchFileContent(
  path: string,
  dx: number,
  dy: number,
  chunkSize: number,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  const sizeResult = await sendLua(
    `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end local n=0 local c=f:read(256) while c do n=n+#c c=f:read(256) end f:close() return n`,
    dx,
    dy,
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
      const result = await sendLua(
        `local f=io.open(${JSON.stringify(path)},"r") if not f then return nil end f:seek("set",${offset}) local c=f:read(${chunkSize}) f:close() collectgarbage("collect") return c`,
        dx,
        dy,
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
  dx: number,
  dy: number,
): Promise<void> {
  const result = await sendLua(
    `local f=io.open(${JSON.stringify(path)},"w") if not f then return false end f:close() return true`,
    dx,
    dy,
  );
  if (result[0] !== true) {
    throw new Error("Failed to create file.");
  }
}

export async function createDir(
  path: string,
  dx: number,
  dy: number,
): Promise<void> {
  const result = await sendLua(
    `return dirent.mkdir(${JSON.stringify(path)})`,
    dx,
    dy,
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
  dx: number,
  dy: number,
): Promise<void> {
  const result = await sendLua(
    `return os.rename(${JSON.stringify(oldPath)}, ${JSON.stringify(newPath)})`,
    dx,
    dy,
  );
  if (result[0] !== true) {
    throw new Error(`Rename failed: ${String(result[1] ?? "unknown error")}`);
  }
}

export async function copyFile(
  srcPath: string,
  dstPath: string,
  dx: number,
  dy: number,
): Promise<void> {
  const lua = `local s=io.open(${JSON.stringify(srcPath)},"r") if not s then return false,"open src failed" end local d=io.open(${JSON.stringify(dstPath)},"w") if not d then s:close() return false,"open dst failed" end local c=s:read(256) while c do d:write(c) c=s:read(256) end s:close() d:close() return true`;
  const result = await sendLua(lua, dx, dy);
  if (result[0] !== true) {
    throw new Error(`Copy failed: ${String(result[1] ?? "unknown error")}`);
  }
}

export async function deleteFile(
  path: string,
  dx: number,
  dy: number,
): Promise<void> {
  const result = await sendLua(
    `return os.remove(${JSON.stringify(path)})`,
    dx,
    dy,
  );
  if (result[0] !== true) {
    throw new Error(`Delete failed: ${String(result[1] ?? "unknown error")}`);
  }
}

export async function fetchDirEntries(
  path: string,
  dx: number,
  dy: number,
): Promise<DirEntry[]> {
  const result = await sendLua(
    `return dirent.list(${JSON.stringify(path)})`,
    dx,
    dy,
  );
  const table = result[0] as LuaTable | null;
  if (!table || typeof table !== "object") {
    throw new Error(
      `Failed to list directory: ${String(result[1] ?? "unknown error")}`,
    );
  }
  return Object.values(table).map((v) => {
    const row = v as LuaTable;
    return {
      name: String(row[1]),
      type: row[2] === 2 ? "dir" : "file",
    } as DirEntry;
  });
}
