// The Global Config block edits a single Lua assignment whose variables carry
// their UI as a trailing block comment:
//
//   dim --[[slider,0,100]], mode --[[select,"absolute","relative"]] = 40, "absolute"
//
// Supported specs: slider,min,max[,step] | select,"a","b",... | toggle | input.
// An input holds any Lua expression, kept as text.
// Only the values after "=" are ever rewritten; names and specs stay verbatim.

export type ConfigSpec =
  | { type: "slider"; min: number; max: number; step: number }
  | { type: "select"; options: string[] }
  | { type: "toggle" }
  | { type: "input" };

export type ConfigEntry = {
  name: string;
  spec: ConfigSpec;
  value: number | string | boolean;
};

export type ParsedConfig = {
  // Script up to and including the "=" sign; kept verbatim on write.
  head: string;
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

// The Lua formatter may move the comma in front of a spec comment, as in
// `dim, --[[slider,0,100]]`. A comment that starts a segment belongs to the
// bare name before it.
function attachTrailingSpecs(segments: string[] | null): string[] | null {
  if (!segments) return null;
  const out: string[] = [];
  for (const segment of segments) {
    const start = segment.search(/\S/);
    const prev = out[out.length - 1];
    if (
      start >= 0 &&
      segment.startsWith("--[[", start) &&
      prev !== undefined &&
      /^\s*[A-Za-z_][A-Za-z0-9_]*\s*$/.test(prev)
    ) {
      const end = skipComment(segment, start);
      if (end >= 0) {
        out[out.length - 1] = prev + segment.slice(start, end + 1);
        const rest = segment.slice(end + 1);
        if (rest.trim() !== "") out.push(rest);
        continue;
      }
    }
    out.push(segment);
  }
  return out;
}

export type ConfigResult =
  { ok: true; config: ParsedConfig } | { ok: false; error: string };

const fail = (error: string): ConfigResult => ({ ok: false, error });

// Explains the first reason the script can't be shown as controls.
export function checkConfigScript(script: string): ConfigResult {
  // Find the assignment "=" outside comments and strings.
  let eq = -1;
  for (let i = 0; i < script.length && eq < 0; i++) {
    if (script.startsWith("--[[", i)) {
      const end = skipComment(script, i);
      if (end < 0) return fail("A --[[ comment is not closed with ]]");
      i = end;
    } else if (script[i] === '"' || script[i] === "'") {
      return fail("Unexpected string before the = sign");
    } else if (script[i] === "=") {
      if (script[i + 1] === "=") return fail("Unexpected == before the = sign");
      eq = i;
    }
  }
  if (eq < 0) return fail("No assignment (name --[[spec]] = value) found");

  const names = attachTrailingSpecs(splitTopLevel(script.slice(0, eq)));
  const values = splitTopLevel(script.slice(eq + 1));
  if (!names || !values) return fail("Unbalanced quotes or comments");
  if (names.length !== values.length) {
    return fail(
      `${names.length} variable(s) but ${values.length} value(s) after =`,
    );
  }

  const entries: ConfigEntry[] = [];
  for (let i = 0; i < names.length; i++) {
    const m = names[i].match(
      /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*--\[\[([\s\S]*)\]\]\s*$/,
    );
    const label = m?.[1] ?? names[i].trim();
    if (!m) {
      return fail(`"${label}" needs a spec comment like --[[slider,0,100]]`);
    }
    const spec = parseSpec(m[2]);
    if (!spec) {
      return fail(
        `${label}: invalid spec "${m[2]}" (slider,min,max[,step] needs min < max, step > 0; select needs quoted options; toggle takes no arguments)`,
      );
    }
    const value = parseValue(spec, values[i]);
    if (value === null) {
      return fail(
        `${label}: value ${values[i].trim() || "(empty)"} doesn't fit its ${spec.type} spec`,
      );
    }
    entries.push({ name: m[1], spec, value });
  }
  if (new Set(entries.map((e) => e.name)).size !== entries.length) {
    return fail("Variable names must be unique");
  }

  return { ok: true, config: { head: script.slice(0, eq + 1), entries } };
}

// Null when the script is not a fully annotated config assignment, so the
// block can fall back to the code editor.
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
  return `${config.head} ${config.entries.map(valueToLua).join(", ")}`;
}
