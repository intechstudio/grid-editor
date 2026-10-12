// Library block script: binds global names to Lua modules in the current page
// folder. The canonical line, as the editor writes it:
//
//   local p=string.format("/%02X/",gpc())Z=require(p.."zona")L=require(p.."layout")
//
// This is the form GridScript.compressScript produces, so the line the editor
// writes is the line the module stores and sends back. The spaced form (one
// space between statements, as in the RFC or written by hand) parses too.

import { GridScript } from "@intechstudio/grid-protocol";

export type LibraryRow = {
  global: string; // global name the module table is bound to: "Z"
  file: string; // module file in the page folder, without ".lua": "zona"
};

const PREFIX = `local p=string.format("/%02X/",gpc())`;

const LUA_KEYWORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "goto",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while",
]);

// Names a row must not bind, because they would not create a global or would
// break the line itself:
// - `p` is the local holding the page path; assigning it would change the
//   path for the rows after it.
// - `self` and `_efn` are locals of every event: the firmware wraps the script
//   in `function (self) local _efn = EFN; ... end` (grid_ui.c).
// - `require`, `string`, `gpc` and `_ENV` are what the line itself calls;
//   rebinding them breaks the rows after it and the next Library block.
const RESERVED_GLOBALS = new Set([
  "p",
  "self",
  "_efn",
  "require",
  "string",
  "gpc",
  "_ENV",
]);

// Firmware function names, human and short. compressScript (shortify) rewrites
// human names to short ones everywhere, even inside strings, and a short name
// is a firmware function a row must not overwrite.
const FIRMWARE_NAMES = new Set(
  GridScript.validator.lookup.flatMap((e: { human: string; short: string }) => [
    e.human,
    e.short,
  ]),
);

export function isValidGlobal(name: string): boolean {
  return (
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) &&
    !LUA_KEYWORDS.has(name) &&
    !RESERVED_GLOBALS.has(name) &&
    !FIRMWARE_NAMES.has(name)
  );
}

// A bare module name: no ".lua", no slashes (it is always in the page folder),
// no dots (require maps them to directory separators), no hyphens (the
// minifier turns "a--b" into "a- -b", even inside strings), nothing that would
// need escaping inside the Lua string literal, and no firmware name (see
// FIRMWARE_NAMES).
export function isValidFile(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name) && !FIRMWARE_NAMES.has(name);
}

const ROW_PATTERN = /^( ?)([A-Za-z_][A-Za-z0-9_]*)=require\(p\.\."([^"]*)"\)/;

// Returns null when the script is not in canonical form.
export function parseLibraryScript(script: string): LibraryRow[] | null {
  if (!script.startsWith(PREFIX)) {
    return null;
  }

  const rows: LibraryRow[] = [];
  let rest = script.slice(PREFIX.length);
  while (rest.length > 0) {
    const match = ROW_PATTERN.exec(rest);
    if (match === null) {
      return null;
    }
    const [whole, , global, file] = match;
    if (!isValidGlobal(global) || !isValidFile(file)) {
      return null;
    }
    rows.push({ global, file });
    rest = rest.slice(whole.length);
  }
  return rows;
}

// Zero rows writes the prefix alone: still valid Lua, and it parses back to
// an empty block instead of falling back to a code block. Rows are written
// without spaces between statements, matching compressScript (see top).
export function libraryScriptToLua(rows: LibraryRow[]): string {
  for (const row of rows) {
    if (!isValidGlobal(row.global)) {
      throw new Error(`Invalid library global name: "${row.global}"`);
    }
    if (!isValidFile(row.file)) {
      throw new Error(`Invalid library file name: "${row.file}"`);
    }
  }
  return [
    PREFIX,
    ...rows.map((e) => `${e.global}=require(p.."${e.file}")`),
  ].join("");
}
