// The Global Config block edits a list of Lua assignments, one variable per
// line, each carrying its UI as a trailing block comment:
//
//   dim = 256 --[[slider,0,1000]]
//   mode = "relative" --[[select,"absolute","relative"]]
//
// A second block comment after the spec is an optional description shown
// under the name: `dim = 40 --[[slider,0,100]] --[[Dims all the LEDs]]`.
// (Scripts are stored on one line, so a `--` line comment can't be used.)
//
// Supported specs: slider,min,max[,step] | select,"a","b",... | toggle | input.
// An input holds any Lua expression, kept as text.
// Only the values are ever rewritten; names, specs and spacing stay verbatim.

export type ConfigSpec =
  | { type: "slider"; min: number; max: number; step: number }
  | { type: "select"; options: string[] }
  | { type: "toggle" }
  | { type: "input" };

export type ConfigEntry = {
  name: string;
  spec: ConfigSpec;
  value: number | string | boolean;
  description?: string;
};

// A line of the script: blank lines stay as they are, variable lines keep
// the text around their value.
type ConfigLine = string | { prefix: string; suffix: string; index: number };

export type ParsedConfig = {
  lines: ConfigLine[];
  entries: ConfigEntry[];
};

// Splits on top-level commas, ignoring commas in quotes, brackets and
// `--[[ ]]` comments.
function splitTopLevel(text: string): string[] | null {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (text.startsWith("--[[", i)) {
      const end = skipComment(text, i);
      if (end < 0) return null;
      i = end;
    } else if (c === '"' || c === "'") {
      const end = skipString(text, i);
      if (end < 0) return null;
      i = end;
    } else if (c === "(" || c === "{" || c === "[") {
      depth++;
    } else if (c === ")" || c === "}" || c === "]") {
      depth--;
    } else if (c === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

// Index of the closing quote, or -1.
function skipString(text: string, i: number): number {
  const quote = text[i];
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === "\\") j++;
    else if (text[j] === quote) return j;
  }
  return -1;
}

// Index of the last "]" of the comment's "]]", or -1. Quoted text inside the
// comment may contain "]]".
function skipComment(text: string, i: number): number {
  for (let j = i + 4; j < text.length; j++) {
    if (text[j] === '"' || text[j] === "'") {
      const end = skipString(text, j);
      if (end < 0) return -1;
      j = end;
    } else if (text.startsWith("]]", j)) {
      return j + 1;
    }
  }
  return -1;
}

function parseString(literal: string): string | null {
  const t = literal.trim();
  if (t.length < 2 || t[0] !== t[t.length - 1] || !`"'`.includes(t[0])) {
    return null;
  }
  if (skipString(t, 0) !== t.length - 1) return null;
  try {
    if (t[0] === '"') return JSON.parse(t);
    const inner = t
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/(?<!\\)"/g, '\\"');
    return JSON.parse(`"${inner}"`);
  } catch {
    return null;
  }
}

function toLuaString(value: string): string {
  return JSON.stringify(value);
}

function parseSpec(body: string): ConfigSpec | null {
  const args = splitTopLevel(body)?.map((e) => e.trim());
  if (!args) return null;
  switch (args[0]) {
    case "toggle":
      return args.length === 1 ? { type: "toggle" } : null;
    case "input":
      return args.length === 1 ? { type: "input" } : null;
    case "slider": {
      if (args.length < 3 || args.length > 4) return null;
      const [min, max, step] = [args[1], args[2], args[3] ?? "1"].map(Number);
      if (![min, max, step].every(Number.isFinite) || step <= 0 || min >= max) {
        return null;
      }
      return { type: "slider", min, max, step };
    }
    case "select": {
      const options = args.slice(1).map(parseString);
      if (options.length === 0 || options.some((e) => e === null)) return null;
      return { type: "select", options: options as string[] };
    }
    default:
      return null;
  }
}

function parseValue(spec: ConfigSpec, text: string) {
  const t = text.trim();
  switch (spec.type) {
    case "input":
      return t !== "" ? t : null;
    case "toggle":
      return t === "true" ? true : t === "false" ? false : null;
    case "slider": {
      const n = Number(t);
      return t !== "" && Number.isFinite(n) ? n : null;
    }
    case "select": {
      const s = parseString(t);
      return s !== null && spec.options.includes(s) ? s : null;
    }
  }
}

export type ConfigResult =
  { ok: true; config: ParsedConfig } | { ok: false; error: string };

const fail = (error: string): ConfigResult => ({ ok: false, error });

// Index where a top-level `--[[` comment starts, outside strings; -1 if none.
function findSpecStart(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text.startsWith("--[[", i)) return i;
    if (text[i] === '"' || text[i] === "'") {
      const end = skipString(text, i);
      if (end < 0) return -2;
      i = end;
    }
  }
  return -1;
}

// Explains the first reason the script can't be shown as controls.
export function checkConfigScript(script: string): ConfigResult {
  const lines: ConfigLine[] = [];
  const entries: ConfigEntry[] = [];

  const rows = script.split("\n");
  for (let n = 0; n < rows.length; n++) {
    const row = rows[n].replace(/\r$/, "");
    if (row.trim() === "") {
      lines.push(row);
      continue;
    }
    const where = rows.length > 1 ? `Line ${n + 1}: ` : "";

    const head = row.match(/^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)/);
    if (!head) {
      return fail(`${where}expected "name = value --[[spec]]"`);
    }
    const name = head[2];
    const rest = row.slice(head[0].length);

    const specStart = findSpecStart(rest);
    if (specStart === -2) return fail(`${where}${name}: unclosed quote`);
    if (specStart < 0) {
      return fail(
        `${where}"${name}" needs a spec comment like --[[slider,0,100]] after its value`,
      );
    }
    const specEnd = skipComment(rest, specStart);
    if (specEnd < 0) {
      return fail(`${where}${name}: the --[[ comment is not closed with ]]`);
    }
    // Optional description: one more block comment, then the end of the line.
    // Plain text, so an apostrophe in it is not a quote.
    let description: string | undefined;
    const after = rest.slice(specEnd + 1).trim();
    if (after !== "") {
      if (!after.startsWith("--[[") || !after.endsWith("]]")) {
        return fail(
          `${where}${name}: only a description comment --[[text]] may follow the spec`,
        );
      }
      const text = after.slice(4, -2);
      if (text.includes("]]")) {
        return fail(`${where}${name}: the description may not contain ]]`);
      }
      description = text.trim() || undefined;
    }

    const specBody = rest.slice(specStart + 4, specEnd - 1);
    const spec = parseSpec(specBody);
    if (!spec) {
      return fail(
        `${where}${name}: invalid spec "${specBody}" (slider,min,max[,step] needs min < max, step > 0; select needs quoted options; toggle and input take no arguments)`,
      );
    }

    const valueText = rest.slice(0, specStart);
    const value = parseValue(spec, valueText);
    if (value === null) {
      return fail(
        `${where}${name}: value ${valueText.trim() || "(empty)"} doesn't fit its ${spec.type} spec`,
      );
    }
    if (entries.some((e) => e.name === name)) {
      return fail(`${where}${name} is defined twice`);
    }

    const leading = valueText.length - valueText.trimStart().length;
    const trailing = valueText.length - valueText.trimEnd().length;
    lines.push({
      prefix: head[0] + valueText.slice(0, leading),
      suffix:
        valueText.slice(valueText.length - trailing) + rest.slice(specStart),
      index: entries.length,
    });
    entries.push({ name, spec, value, description });
  }

  if (entries.length === 0) return fail("No variables found");
  return { ok: true, config: { lines, entries } };
}

// Null when the script is not a fully annotated config, so the block can
// fall back to the code editor.
export function parseConfigScript(script: string): ParsedConfig | null {
  const result = checkConfigScript(script);
  return result.ok ? result.config : null;
}

function valueToLua(entry: ConfigEntry): string {
  if (entry.spec.type === "input") {
    // A cleared field must still be a valid expression
    return String(entry.value).trim() || "nil";
  }
  return typeof entry.value === "string"
    ? toLuaString(entry.value)
    : String(entry.value);
}

export function configToLua(config: ParsedConfig): string {
  return config.lines
    .map((line) =>
      typeof line === "string"
        ? line
        : line.prefix + valueToLua(config.entries[line.index]) + line.suffix,
    )
    .join("\n");
}
