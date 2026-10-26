import {
  ElementType,
  EventType,
  GridScript,
} from "@intechstudio/grid-protocol";
import {
  createDir,
  fetchDirEntries,
  invalidateLuaModule,
  pageNumberToFolderPath,
  writeFileContent,
  WRITE_CHUNK_SIZE,
} from "../main/panels/FileManager/FileManager";
import type { GridModule } from "../runtime/runtime";
import testSource from "./test/test.lua?raw";
import zonaSource from "./zona/zona.lua?raw";

export type LibraryRow = {
  global: string; // "_Test"
  file: string; // "test", in the page folder
};

export type BundledLibrary = {
  file: string;
  global: string;
  source: string;
};

// Libraries the user can install from the editor. Their globals start with
// _ and an uppercase letter, so user code doesn't overwrite them by accident.
export const bundledLibraries: readonly BundledLibrary[] = [
  { file: "test", global: "_Test", source: testSource },
  { file: "zona", global: "_Z", source: zonaSource },
];

export function findBundledLibrary(file: string): BundledLibrary | undefined {
  return bundledLibraries.find((e) => e.file === file);
}

// Names the user can't pick for a library: firmware functions, names the
// Library block line uses, and Lua keywords.
const RESERVED_NAMES = new Set([
  ...GridScript.validator.lookup.flatMap(
    (e: { human?: string; short?: string }) => [e.human, e.short],
  ),
  ...["p", "self", "require", "string", "gpc"],
  ...["and", "break", "do", "else", "elseif", "end", "false", "for"],
  ...["function", "goto", "if", "in", "local", "nil", "not", "or"],
  ...["repeat", "return", "then", "true", "until", "while"],
]);

export function isValidGlobal(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !RESERVED_NAMES.has(name);
}

// A global the user can bind their own file to: names starting with _ and an
// uppercase letter belong to bundled libraries (and to Lua itself).
export function isUserGlobal(name: string): boolean {
  return isValidGlobal(name) && !/^_[A-Z]/.test(name);
}

export function isValidFile(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name) && !RESERVED_NAMES.has(name);
}

// Keeps the names the blocks rely on: a bundled library loads under its own
// global, a user file under a user global, and no global is loaded twice.
export function areValidRows(rows: LibraryRow[]): boolean {
  const globals = rows.map((e) => e.global);
  return (
    new Set(globals).size === globals.length &&
    rows.every((e) => {
      const bundled = findBundledLibrary(e.file);
      return (
        isValidFile(e.file) &&
        (typeof bundled === "undefined"
          ? isUserGlobal(e.global)
          : e.global === bundled.global)
      );
    })
  );
}

// Lets the user add libraries only in the System element's Setup, which the
// module runs before every other Setup of the page, so all elements can use
// them. Never in a function body tab.
export function isLibraryPlace(
  elementType: ElementType,
  eventType: EventType,
  isFunctionBody: boolean,
): boolean {
  return (
    elementType === ElementType.SYSTEM &&
    eventType === EventType.SETUP &&
    !isFunctionBody
  );
}

const PREFIX = `local p=string.format("/%02X/",gpc())`;
const ROW = /^ ?([A-Za-z_][A-Za-z0-9_]*)=require\(p\.\."([A-Za-z0-9_]+)"\)/;

// Reads the libraries a Library block loads; null when the script is not a
// Library block, so the user can open it as a code block instead.
export function parseLibraryScript(script: string): LibraryRow[] | null {
  if (!script.startsWith(PREFIX)) {
    return null;
  }
  const rows: LibraryRow[] = [];
  let rest = script.slice(PREFIX.length);
  while (rest.length > 0) {
    const match = ROW.exec(rest);
    if (match === null) {
      return null;
    }
    rows.push({ global: match[1], file: match[2] });
    rest = rest.slice(match[0].length);
  }
  return areValidRows(rows) ? rows : null;
}

// Loads each library from the current page folder into its global.
export function libraryScriptToLua(rows: LibraryRow[]): string {
  return [
    PREFIX,
    ...rows.map((e) => `${e.global}=require(p.."${e.file}")`),
  ].join("");
}

// Shows the user which libraries are in the page folder.
export async function listPageLibraries(
  pageNumber: number,
  module: GridModule,
): Promise<string[]> {
  if (!(await pageFolderExists(pageNumber, module))) {
    return [];
  }
  const entries = await fetchDirEntries(
    pageNumberToFolderPath(pageNumber),
    module,
  );
  return entries
    .filter((e) => e.type === "file" && e.name.endsWith(".lua"))
    .map((e) => e.name.slice(0, -".lua".length));
}

async function pageFolderExists(
  pageNumber: number,
  module: GridModule,
): Promise<boolean> {
  const name = pageNumberToFolderPath(pageNumber).replace(/\//g, "");
  const root = await fetchDirEntries("/", module);
  return root.some((e) => e.type === "dir" && e.name === name);
}

// Lets the user install a bundled library that is missing from the page
// folder and use it right away.
export async function installLibrary(
  library: BundledLibrary,
  pageNumber: number,
  module: GridModule,
): Promise<void> {
  const folder = pageNumberToFolderPath(pageNumber);
  if (!(await pageFolderExists(pageNumber, module))) {
    await createDir(folder.replace(/\/$/, ""), module);
  }
  await writeFileContent(
    `${folder}${library.file}.lua`,
    GridScript.compressScript(library.source),
    module,
    WRITE_CHUNK_SIZE,
  );
  await invalidateLuaModule(`${folder}${library.file}`, module);
  await rerunSetups(library.global, module);
}

// Runs every Setup of the page again in the order the module runs them on a
// page load (System first, then the elements), so the blocks that use the
// library start without a page change. The copy still bound to the global
// is released first, so the module doesn't hold two copies.
async function rerunSetups(global: string, module: GridModule) {
  const { value } = await module.execLUAImmediateAndEvalaute(
    `do local g=rawget(_G,"${global}") ` +
      `if type(g)=="table" and type(g.unload)=="function" then pcall(g.unload,g) end end ` +
      `_G["${global}"]=nil collectgarbage() ` +
      `local n,f local function run(e,i) if e and e.ini then local ok,err=pcall(e.ini,e) ` +
      `if not ok and not f then n,f=i,tostring(err):sub(1,100) end end end ` +
      `run(ele[#ele],-1) for i=0,#ele-1 do run(ele[i],i) end ` +
      `return f==nil,n,f`,
  );
  if (value[0] !== true) {
    const where = value[1] === -1 ? "System" : `element ${value[1]}`;
    throw new Error(`Setup failed on ${where}: ${String(value[2])}`);
  }
}
