import { GridScript } from "@intechstudio/grid-protocol";
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

export type LibraryRow = {
  global: string; // "Test"
  file: string; // "test", in the page folder
};

export type BundledLibrary = {
  file: string;
  global: string;
  source: string;
};

// Libraries the user can install from the editor.
export const bundledLibraries: readonly BundledLibrary[] = [
  { file: "test", global: "Test", source: testSource },
];

export function findBundledLibrary(file: string): BundledLibrary | undefined {
  return bundledLibraries.find((e) => e.file === file);
}

export function isValidGlobal(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export function isValidFile(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name);
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
  return rows;
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
  elementIndex: number,
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
  await runSetup(elementIndex, module);
}

async function runSetup(elementIndex: number, module: GridModule) {
  const element = elementIndex === 255 ? "ele[#ele]" : `ele[${elementIndex}]`;
  const { value } = await module.execLUAImmediateAndEvalaute(
    `local e=${element} if not(e and e.ini)then return false,"no Setup" end ` +
      `local ok,err=pcall(e.ini,e) return ok,ok and nil or tostring(err):sub(1,120)`,
  );
  if (value[0] !== true) {
    throw new Error(`Setup failed: ${String(value[1] ?? "unknown error")}`);
  }
}
