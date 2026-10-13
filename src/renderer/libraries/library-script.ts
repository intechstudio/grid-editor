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
export const RESERVED_GLOBALS: ReadonlySet<string> = new Set([
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
// is a firmware function a row must not overwrite. Some lookup entries lack
// one of the two names.
const FIRMWARE_LOOKUP: { human?: string; short?: string }[] =
  GridScript.validator.lookup;

const FIRMWARE_NAMES = new Set(
  FIRMWARE_LOOKUP.flatMap((e) => [e.human, e.short]),
);

// Only for the rejection message: which short name a human name becomes.
const FIRMWARE_SHORT_NAMES = new Map<string, string>();
for (const { human, short } of FIRMWARE_LOOKUP) {
  if (
    typeof human !== "undefined" &&
    typeof short !== "undefined" &&
    human !== short
  ) {
    FIRMWARE_SHORT_NAMES.set(human, short);
  }
}

// Why a name is rejected for being a firmware name, or undefined.
export function firmwareNameProblem(name: string): string | undefined {
  if (!FIRMWARE_NAMES.has(name)) {
    return undefined;
  }
  const short = FIRMWARE_SHORT_NAMES.get(name);
  return typeof short !== "undefined"
    ? `"${name}" is a firmware function name, sent to the module as "${short}"`
    : `"${name}" is a firmware function`;
}

const RESERVED_GLOBAL_REASONS: Record<string, string> = {
  p: `"p" holds the page folder path in this line`,
  self: `"self" is a local in every event, not a global`,
  _efn: `"_efn" is a local in every event, not a global`,
  require: `"require" is used by this line`,
  string: `"string" is used by this line`,
  gpc: `"gpc" is used by this line`,
  _ENV: `"_ENV" is used by this line`,
};

// Why a non-empty name is not a Lua identifier, or undefined when it is one.
export function identifierProblem(name: string): string | undefined {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    return "Use letters, digits and _, not starting with a digit";
  }
  if (LUA_KEYWORDS.has(name)) {
    return `"${name}" is a Lua keyword`;
  }
  return undefined;
}

// Why a global name is rejected, or undefined when it is valid.
export function globalNameProblem(name: string): string | undefined {
  if (name.length === 0) {
    return "Enter a global name";
  }
  const identifier = identifierProblem(name);
  if (typeof identifier !== "undefined") {
    return identifier;
  }
  if (RESERVED_GLOBALS.has(name)) {
    return RESERVED_GLOBAL_REASONS[name] ?? `"${name}" is reserved`;
  }
  return firmwareNameProblem(name);
}

export function isValidGlobal(name: string): boolean {
  return typeof globalNameProblem(name) === "undefined";
}

// A bare module name: no ".lua", no slashes (it is always in the page folder),
// no dots (require maps them to directory separators), no hyphens (the
// minifier turns "a--b" into "a- -b", even inside strings), nothing that would
// need escaping inside the Lua string literal, and no firmware name (see
// FIRMWARE_NAMES). Returns why a file name is rejected, or undefined when it
// is valid.
export function fileNameProblem(name: string): string | undefined {
  if (name.length === 0) {
    return "Enter a file name";
  }
  if (name.endsWith(".lua")) {
    return 'Leave out ".lua"';
  }
  if (name.includes("/")) {
    return "Files load from the page folder, no paths";
  }
  if (name.includes("-")) {
    return "No hyphens: the module rewrites -- inside strings";
  }
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    return "Use letters, digits and _ only";
  }
  return firmwareNameProblem(name);
}

export function isValidFile(name: string): boolean {
  return typeof fileNameProblem(name) === "undefined";
}

// Lua standard globals, plus firmware globals that are not in the firmware
// function lookup (FIRMWARE_NAMES) or RESERVED_GLOBALS. Binding one is valid
// Lua, but replaces it for every script on the module, so the block warns.
const BUILTIN_GLOBALS = new Set([
  "_G",
  "_VERSION",
  "assert",
  "collectgarbage",
  "coroutine",
  "debug",
  "dofile",
  "error",
  "getmetatable",
  "io",
  "ipairs",
  "load",
  "loadfile",
  "math",
  "next",
  "os",
  "package",
  "pairs",
  "pcall",
  "print",
  "rawequal",
  "rawget",
  "rawlen",
  "rawset",
  "select",
  "setmetatable",
  "table",
  "tonumber",
  "tostring",
  "type",
  "utf8",
  "warn",
  "xpcall",
  "EFN", // current event function name, saved and restored around every event
  "dirent", // firmware file system listing
]);

// True for a valid global name that replaces a Lua or firmware built-in.
export function shadowsBuiltinGlobal(name: string): boolean {
  return BUILTIN_GLOBALS.has(name) && isValidGlobal(name);
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
  return formatLibraryScript(rows);
}

// The same line without validation, for rows that are still being edited.
// The block marks such a script invalid, so it is never sent to the module.
export function formatLibraryScript(rows: LibraryRow[]): string {
  return [
    PREFIX,
    ...rows.map((e) => `${e.global}=require(p.."${e.file}")`),
  ].join("");
}

// Whether a script assigns the global `name` at top level, as text:
// `Name=…`, `Name = …` (not `local Name`, `x.Name`, `x:Name` or `Name==`) or
// `function Name(`. A Library row's global is then replaced (or replaces
// that one), depending on which runs last (RFC 6.1).
// Known limits of the text check: matches in comments and strings count,
// `local a,Z=…` counts (the `local` check only looks right before the name),
// and so does a table key `{Z=1}`.
export function assignsGlobal(script: string, name: string): boolean {
  const n = name.replace(/[^A-Za-z0-9_]/g, "");
  if (n.length === 0) {
    return false;
  }
  const assignment = new RegExp(`(?<![\\w.:])(?<!local\\s+)${n}\\s*=(?!=)`);
  const declaration = new RegExp(`(?<![\\w.:])function\\s+${n}\\s*\\(`);
  return assignment.test(script) || declaration.test(script);
}

// Where else a global is assigned: the labels of the scripts that do.
export function globalClashes(
  name: string,
  scripts: { label: string; script: string }[],
): string[] {
  return [
    ...new Set(
      scripts.filter((e) => assignsGlobal(e.script, name)).map((e) => e.label),
    ),
  ];
}
