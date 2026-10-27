import {
  EventType,
  GridScript,
  NumberToEventType,
} from "@intechstudio/grid-protocol";
import { writable } from "svelte/store";
import {
  createDir,
  fetchDirEntries,
  fetchFileHead,
  invalidateLuaModule,
  pageNumberToFolderPath,
  writeFileContent,
  WRITE_CHUNK_SIZE,
} from "../main/panels/FileManager/FileManager";
import type {
  GridAction,
  GridElement,
  GridEvent,
  GridModule,
  GridPage,
} from "../runtime/runtime";
import testSource from "./test/test.lua?raw";

export type LibraryRow = {
  global: string; // "_Test"
  file: string; // "test", in the page folder
};

// What a library file declares in its first two lines:
//   local LIB_NAME = "_Test"
//   local LIB_VERSION = "1.0.0"
export type LibraryHeader = {
  name: string;
  version: string;
};

export type BundledLibrary = {
  file: string;
  global: string;
  version: string;
  source: string;
};

// The global a library binds starts with an underscore, so it stays apart
// from the firmware's names and the user's own variables.
export const LIB_NAME_RULE = /^_[A-Za-z][A-Za-z0-9_]*$/;
export const LIB_VERSION_RULE = /^\d+\.\d+\.\d+$/;
const FILE_RULE = /^[A-Za-z0-9_]+$/;

// The header also matches after compressScript, which joins the two lines.
const HEADER =
  /^local\s+LIB_NAME\s*=\s*"([^"\n]*)"\s*local\s+LIB_VERSION\s*=\s*"([^"\n]*)"/;

// Bytes the editor reads from the top of a module file to find its header.
const HEAD_LENGTH = 150;

// Reads which global a library binds and its version; null when the file
// doesn't start with a valid header.
export function parseLibraryHeader(source: string): LibraryHeader | null {
  const match = HEADER.exec(source);
  if (
    match === null ||
    !LIB_NAME_RULE.test(match[1]) ||
    !LIB_VERSION_RULE.test(match[2])
  ) {
    return null;
  }
  return { name: match[1], version: match[2] };
}

function bundle(file: string, source: string): BundledLibrary {
  const header = parseLibraryHeader(source);
  if (header === null) {
    throw new Error(`${file}.lua needs LIB_NAME and LIB_VERSION at its top`);
  }
  return { file, global: header.name, version: header.version, source };
}

// Libraries the editor ships and can install on the module.
export const bundledLibraries: readonly BundledLibrary[] = [
  bundle("test", testSource),
];

export function findBundledLibrary(file: string): BundledLibrary | undefined {
  return bundledLibraries.find((e) => e.file === file);
}

// Keeps the names the blocks rely on: each library once, each global once.
export function areValidRows(rows: LibraryRow[]): boolean {
  const files = rows.map((e) => e.file);
  const globals = rows.map((e) => e.global);
  return (
    new Set(files).size === files.length &&
    new Set(globals).size === globals.length &&
    rows.every((e) => LIB_NAME_RULE.test(e.global) && FILE_RULE.test(e.file))
  );
}

// Lets the user load libraries in any element's Setup, never in a function
// body tab.
export function isLibraryPlace(
  eventType: EventType,
  isFunctionBody: boolean,
): boolean {
  return eventType === EventType.SETUP && !isFunctionBody;
}

// A library missing from the page folder prints a message instead of
// stopping the Setup, so the rest of the Setup still runs and the module
// still accepts the config.
const PREFIX =
  `local p=string.format("/%02X/",gpc())` +
  `local function r(n)local ok,m=pcall(require,p..n)if ok then return m end ` +
  `print(p..n..".lua missing")end`;
const ROW = /^ ?([A-Za-z_][A-Za-z0-9_]*)=r\("([A-Za-z0-9_]+)"\)/;

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
  const lines = rows.map((e) => `${e.global}=r("${e.file}")`).join("");
  return lines === "" ? PREFIX : `${PREFIX} ${lines}`;
}

// The Lua files of a page folder and the header each one starts with.
export type PageLibraries = Map<string, LibraryHeader | null>;

// The global a row loads when the user picks this file: the module file's
// header, or the bundled copy's when the file isn't on the module.
export function globalForFile(
  file: string,
  files: PageLibraries | undefined,
): string | undefined {
  if (typeof files !== "undefined" && files.has(file)) {
    return files.get(file)?.name;
  }
  return findBundledLibrary(file)?.global;
}

export type LibrarySuggestion = { value: string; info: string };

// Offers the bundled libraries the user can install and the libraries on
// the module, each with the global it binds and its version.
export function librarySuggestions(
  files: PageLibraries | undefined,
): LibrarySuggestion[] {
  const bundled = bundledLibraries
    .filter((e) => !files?.has(e.file))
    .map((e) => ({
      value: e.file,
      info: `${e.global} ${e.version} · bundled`,
    }));
  const onModule: LibrarySuggestion[] = [];
  for (const [file, header] of files ?? []) {
    if (header !== null) {
      onModule.push({
        value: file,
        info: `${header.name} ${header.version} · on module`,
      });
    }
  }
  return [...bundled, ...onModule];
}

export type LibraryRowStatus =
  // The module can't be asked: the bundled version, when there is one.
  | { kind: "unknown"; version?: string }
  | { kind: "present"; version: string; bundledVersion?: string }
  | { kind: "missing"; library: BundledLibrary }
  // Missing on the module and the editor has no copy to install.
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string };

// Tells the user whether a row's library is on the module, can be
// installed, or doesn't load what the row expects.
export function libraryRowStatus(
  row: LibraryRow,
  files: PageLibraries | undefined,
  folder: string,
): LibraryRowStatus {
  const bundled = findBundledLibrary(row.file);
  if (typeof files === "undefined") {
    return { kind: "unknown", version: bundled?.version };
  }
  if (files.has(row.file)) {
    const header = files.get(row.file);
    if (header == null) {
      return {
        kind: "error",
        message: `${row.file}.lua doesn't start with LIB_NAME and LIB_VERSION`,
      };
    }
    if (header.name !== row.global) {
      return {
        kind: "error",
        message: `${row.file}.lua exports ${header.name}, pick it again to load it`,
      };
    }
    return {
      kind: "present",
      version: header.version,
      bundledVersion:
        bundled && bundled.version !== header.version
          ? bundled.version
          : undefined,
    };
  }
  if (typeof bundled === "undefined") {
    return {
      kind: "unavailable",
      message: `${row.file}.lua is missing in ${folder} and the editor has no copy to install`,
    };
  }
  if (bundled.global !== row.global) {
    return {
      kind: "error",
      message: `The bundled ${row.file}.lua exports ${bundled.global}, pick it again to load it`,
    };
  }
  return { kind: "missing", library: bundled };
}

// Globals that Library blocks running before this one already load, in the
// order the module runs the Setups: System first, then the elements. Only
// the Setups the editor has loaded count.
export function globalsLoadedBefore(action: GridAction): Set<string> {
  const event = action.parent as GridEvent;
  const element = event.parent as GridElement;
  const page = element.parent as GridPage;
  const runOrder = (e: GridElement) =>
    e.elementIndex === 255 ? -1 : e.elementIndex;
  const elements = [...page.control_elements].sort(
    (a, b) => runOrder(a) - runOrder(b),
  );
  const globals = new Set<string>();
  for (const e of elements) {
    for (const setup of e.events) {
      if (
        NumberToEventType(setup.type) !== EventType.SETUP ||
        !setup.isLoaded()
      ) {
        continue;
      }
      for (const other of setup.config) {
        if (other === action) {
          return globals;
        }
        if (other.short === "lib") {
          for (const row of parseLibraryScript(other.script) ?? []) {
            globals.add(row.global);
          }
        }
      }
    }
  }
  return globals;
}

// The latest read of each page folder, shared by every Library block on it.
export const pageLibraries = writable(
  new Map<string, PageLibraries | undefined>(),
);

export function pageLibrariesKey(pageNumber: number, module: GridModule) {
  return `${module.id}/${pageNumber}`;
}

const runningReads = new Map<string, Promise<PageLibraries | undefined>>();

// Shows the user which libraries are in the page folder and what each one
// declares; undefined when the module can't be asked. Blocks that open
// together share one read.
export function readPageLibraries(
  pageNumber: number,
  module: GridModule,
): Promise<PageLibraries | undefined> {
  const key = pageLibrariesKey(pageNumber, module);
  const running = runningReads.get(key);
  if (typeof running !== "undefined") {
    return running;
  }
  const read = fetchPageLibraries(pageNumber, module)
    .catch(() => undefined)
    .then((files) => {
      pageLibraries.update((all) => new Map(all).set(key, files));
      return files;
    })
    .finally(() => runningReads.delete(key));
  runningReads.set(key, read);
  return read;
}

async function fetchPageLibraries(
  pageNumber: number,
  module: GridModule,
): Promise<PageLibraries> {
  const files: PageLibraries = new Map();
  if (!(await pageFolderExists(pageNumber, module))) {
    return files;
  }
  const folder = pageNumberToFolderPath(pageNumber);
  const entries = await fetchDirEntries(folder, module);
  for (const entry of entries) {
    if (entry.type !== "file" || !entry.name.endsWith(".lua")) {
      continue;
    }
    const head = await fetchFileHead(
      `${folder}${entry.name}`,
      module,
      HEAD_LENGTH,
    );
    files.set(
      entry.name.slice(0, -".lua".length),
      head === null ? null : parseLibraryHeader(head),
    );
  }
  return files;
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
