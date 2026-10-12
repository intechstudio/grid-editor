// Library files on a connected module: list the page folder, read a module's
// version back, install or update a bundled library, and re-run Setup.

import { GridScript } from "@intechstudio/grid-protocol";
import {
  fetchDirEntries,
  invalidateLuaModule,
  pageNumberToFolderPath,
  writeFileContent,
  WRITE_CHUNK_SIZE,
} from "../main/panels/FileManager/FileManager";
import type { GridModule } from "../runtime/runtime";
import { logger } from "../runtime/runtime.store";
import type { BundledLibrary } from "./registry";
import type { LibraryBinding } from "./library-status";

// The require path of a page-folder module: "/00/zona".
export function libraryModulePath(pageNumber: number, file: string): string {
  return `${pageNumberToFolderPath(pageNumber)}${file}`;
}

// Module names (without ".lua") of the Lua files in a page folder.
export async function listPageLibraries(
  pageNumber: number,
  module: GridModule,
): Promise<string[]> {
  const entries = await fetchDirEntries(
    pageNumberToFolderPath(pageNumber),
    module,
  );
  return entries
    .filter((e) => e.type === "file" && e.name.endsWith(".lua"))
    .map((e) => e.name.slice(0, -".lua".length));
}

// Reads what Setup bound to each global, in one call. Uses rawget on _G, so
// nothing is required or run: a file Setup didn't load stays unloaded. Each
// global answers a pair (bound, version or false); false instead of nil keeps
// the returned list aligned.
export async function readBoundLibraries(
  globals: readonly string[],
  module: GridModule,
): Promise<Record<string, LibraryBinding>> {
  if (globals.length === 0) {
    return {};
  }
  const names = globals.map((e) => JSON.stringify(e)).join(",");
  const { value } = await module.execLUAImmediateAndEvalaute(
    `local r={} for _,n in ipairs({${names}}) do local g=rawget(_G,n) ` +
      `local t=type(g)=="table" r[#r+1]=t r[#r+1]=t and type(g.VERSION)=="string" and g.VERSION or false end ` +
      `return table.unpack(r)`,
  );
  const result: Record<string, LibraryBinding> = {};
  globals.forEach((global, i) => {
    const version = value[i * 2 + 1];
    result[global] =
      value[i * 2] === true
        ? typeof version === "string"
          ? { bound: true, version }
          : { bound: true }
        : { bound: false };
  });
  return result;
}

// Writes the bundled source the way the File Manager saves a .lua file, then
// drops the cached module (full require path) so the next require reloads it.
export async function installLibrary(
  library: BundledLibrary,
  pageNumber: number,
  module: GridModule,
): Promise<void> {
  await writeFileContent(
    `${pageNumberToFolderPath(pageNumber)}${library.file}`,
    GridScript.compressScript(library.source),
    module,
    WRITE_CHUNK_SIZE,
  );
  await invalidateLuaModule(libraryModulePath(pageNumber, library.id), module);
}

// Runs an element's Setup again in the running VM, so a library installed
// (or fixed) after Setup failed to require it is bound now. Everything else in
// that Setup runs again too, and other elements keep the old table until the
// page reloads. Calls the handler the
// firmware defined (`ele[i].ini`, grid_ui.c) instead of resending the
// config, which would mark the page as changed. The system element (255) is
// the last entry of `ele`.
export async function rerunSetup(
  elementIndex: number,
  module: GridModule,
): Promise<void> {
  const element = elementIndex === 255 ? "ele[#ele]" : `ele[${elementIndex}]`;
  const { value } = await module.execLUAImmediateAndEvalaute(
    `local e=${element} if not(e and e.ini)then return false,"no Setup" end ` +
      `local ok,err=pcall(e.ini,e) return ok,ok and nil or tostring(err):sub(1,120)`,
  );
  if (value[0] !== true) {
    throw new Error(`Setup failed: ${String(value[1] ?? "unknown error")}`);
  }
}

// Last version logged per module, page and file, so a version is logged when
// it changes rather than every time a block mounts.
const loggedVersions = new Map<string, string>();

export function logLibraryVersion(
  module: GridModule,
  pageNumber: number,
  file: string,
  version: string,
) {
  const key = `${module.dx},${module.dy}:${pageNumber}:${file}`;
  if (loggedVersions.get(key) === version) {
    return;
  }
  loggedVersions.set(key, version);
  logger.set({
    type: "info",
    mode: 0,
    classname: "libraryversion",
    message: `Library ${file} ${version} loaded on page ${pageNumber + 1} (${libraryModulePath(pageNumber, file)}.lua)`,
  });
}
