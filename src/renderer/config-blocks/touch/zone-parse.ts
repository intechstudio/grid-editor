// Touch block scripts (RFC 5, 6.5). The canonical lines, as the editor writes
// them:
//
//   Z.fader("f1",0,0,1,9,{res=10,mode="glide"},function(self)
//   Z.tick(self,{ms=10})
//
// This is the form GridScript.compressScript produces: no spaces, double
// quotes, numbers in shortest form. Options are written in schema order and
// only when they differ from the kind's default; options this editor doesn't
// know are kept as raw `key=value` text after the known ones. Hand-written
// lines with other spacing, option order or single quotes parse too, and
// write back canonical. Anything else parses to null and the block shows it
// as code.

import {
  type OptionSchema,
  type Zone,
  type ZoneKind,
  type ZoneOptionValue,
  type ZoneTick,
  zoneKindList,
  zoneOptionDefault,
  zoneOptionSchema,
  zoneTickDefaults,
  zoneTickSchema,
} from "./zone-model";

// The global the touch blocks call. Fixed in v1 (RFC 5).
export const ZONA_GLOBAL = "_Z";

export const ZONE_END_SCRIPT = "end)";
export const ZONE_START_SCRIPT = `${ZONA_GLOBAL}.start(self)`;

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*/;
const NUMBER =
  /^(-?)\s*(0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)$/;

// A cursor over one line. Every read skips leading whitespace and returns
// null (or false) without moving when the text doesn't match.
class Reader {
  private i = 0;

  constructor(private readonly s: string) {}

  private ws() {
    while (this.i < this.s.length && /\s/.test(this.s[this.i])) {
      this.i++;
    }
  }

  eat(token: string): boolean {
    this.ws();
    if (!this.s.startsWith(token, this.i)) {
      return false;
    }
    this.i += token.length;
    return true;
  }

  atEnd(): boolean {
    this.ws();
    return this.i === this.s.length;
  }

  identifier(): string | null {
    this.ws();
    const match = IDENTIFIER.exec(this.s.slice(this.i));
    if (match === null) {
      return null;
    }
    this.i += match[0].length;
    return match[0];
  }

  // A plain string literal, "..." or '...'. Escapes and a double quote inside
  // are not supported: no name or option value needs them, and the line is
  // written back with double quotes.
  string(): string | null {
    this.ws();
    const quote = this.s[this.i];
    if (quote !== '"' && quote !== "'") {
      return null;
    }
    const end = this.s.indexOf(quote, this.i + 1);
    if (end === -1) {
      return null;
    }
    const text = this.s.slice(this.i + 1, end);
    if (/["\\\n\r]/.test(text)) {
      return null;
    }
    this.i = end + 1;
    return text;
  }

  number(): number | null {
    this.ws();
    const match = /^-?\s*[0-9a-fA-FxX.eE+-]+/.exec(this.s.slice(this.i));
    if (match === null) {
      return null;
    }
    // the character class overreaches ("1,-2" stops at ","), so check
    const value = parseNumber(match[0]);
    if (value === null) {
      return null;
    }
    this.i += match[0].length;
    return value;
  }

  // Raw text of one table value, up to the next top-level `,`, `;` or `}`.
  // Brackets and strings are skipped over; a comment makes it fail.
  value(): string | null {
    this.ws();
    const start = this.i;
    let depth = 0;
    while (this.i < this.s.length) {
      const c = this.s[this.i];
      if (c === '"' || c === "'") {
        const end = closingQuote(this.s, this.i);
        if (end === -1) {
          return null;
        }
        this.i = end + 1;
        continue;
      }
      if (c === "-" && this.s[this.i + 1] === "-") {
        return null;
      }
      if (c === "(" || c === "[" || c === "{") {
        depth++;
      } else if (c === ")" || c === "]" || c === "}") {
        if (depth === 0) {
          break;
        }
        depth--;
      } else if ((c === "," || c === ";") && depth === 0) {
        break;
      }
      this.i++;
    }
    const raw = this.s.slice(start, this.i).trim();
    return depth === 0 && raw.length > 0 ? raw : null;
  }

  // `{key=value,...}` as raw entries in the order found. Only `name=value`
  // entries: a positional or `[key]=` entry fails, and so does a repeated key.
  table(): { key: string; raw: string }[] | null {
    if (!this.eat("{")) {
      return null;
    }
    const entries: { key: string; raw: string }[] = [];
    while (!this.eat("}")) {
      const key = this.identifier();
      if (key === null || !this.eat("=") || this.eat("=")) {
        return null;
      }
      const raw = this.value();
      if (raw === null || entries.some((e) => e.key === key)) {
        return null;
      }
      entries.push({ key, raw });
      if (!this.eat(",") && !this.eat(";")) {
        if (!this.eat("}")) {
          return null;
        }
        break;
      }
    }
    return entries;
  }
}

function closingQuote(s: string, start: number): number {
  for (let i = start + 1; i < s.length; i++) {
    if (s[i] === "\\") {
      i++;
    } else if (s[i] === s[start]) {
      return i;
    } else if (s[i] === "\n") {
      return -1;
    }
  }
  return -1;
}

function parseNumber(text: string): number | null {
  const match = NUMBER.exec(text.trim());
  if (match === null) {
    return null;
  }
  const value = Number(match[2]);
  return Number.isFinite(value) ? (match[1] === "-" ? -value : value) : null;
}

// A raw table value as the schema's type, or null when it is not a plain
// literal of that type.
function literal(schema: OptionSchema, raw: string): ZoneOptionValue | null {
  if (schema.type === "enum" || schema.type === "color") {
    const reader = new Reader(raw);
    const value = reader.string();
    return value !== null && reader.atEnd() ? value : null;
  }
  return parseNumber(raw);
}

type Options = { opt: Record<string, ZoneOptionValue>; unknown?: string };

function readOptions(
  entries: { key: string; raw: string }[],
  schema: OptionSchema[],
): Options | null {
  const opt: Record<string, ZoneOptionValue> = {};
  const unknown: string[] = [];
  for (const { key, raw } of entries) {
    const known = schema.find((e) => e.key === key);
    if (typeof known === "undefined") {
      unknown.push(`${key}=${raw}`);
      continue;
    }
    const value = literal(known, raw);
    if (value === null) {
      return null;
    }
    opt[key] = value;
  }
  return unknown.length > 0 ? { opt, unknown: unknown.join(",") } : { opt };
}

function luaString(text: string): string {
  if (/["\\\n\r]/.test(text)) {
    throw new Error(`Cannot write ${JSON.stringify(text)} as a Lua string`);
  }
  return `"${text}"`;
}

// Shortest form: 0.5, 10, -1.
function luaNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot write ${value} as a Lua number`);
  }
  return String(value);
}

function luaValue(value: ZoneOptionValue): string {
  return typeof value === "string" ? luaString(value) : luaNumber(value);
}

function writeOptions(
  options: Options,
  schema: OptionSchema[],
  defaultOf: (key: string) => ZoneOptionValue | undefined,
): string {
  for (const key of Object.keys(options.opt)) {
    if (!schema.some((e) => e.key === key)) {
      throw new Error(`Unknown option "${key}": keep it in unknown`);
    }
  }
  const parts: string[] = [];
  for (const entry of schema) {
    const { key } = entry;
    const value = options.opt[key];
    if (typeof value === "undefined") {
      continue;
    }
    // the parser reads an enum or a colour only as a string, a number only
    // as a number
    const isText = entry.type === "enum" || entry.type === "color";
    if (typeof value !== (isText ? "string" : "number")) {
      throw new Error(`Option "${key}" must be a ${entry.type}`);
    }
    if (value !== defaultOf(key)) {
      parts.push(`${key}=${luaValue(value)}`);
    }
  }
  if (typeof options.unknown !== "undefined" && options.unknown.length > 0) {
    parts.push(options.unknown);
  }
  return `{${parts.join(",")}}`;
}

// `_Z.fader("f1",0,0,1,9,{res=10},function(self)`, the zone block's opening
// line. Returns null when the script is not a zone opening line.
export function parseZone(script: string): Zone | null {
  const reader = new Reader(script);
  if (!reader.eat(ZONA_GLOBAL) || !reader.eat(".")) {
    return null;
  }
  const kind = reader.identifier() as ZoneKind;
  if (!zoneKindList.includes(kind) || !reader.eat("(")) {
    return null;
  }
  const name = reader.string();
  if (name === null) {
    return null;
  }
  const cells: number[] = [];
  for (let i = 0; i < 4; i++) {
    const value = reader.eat(",") ? reader.number() : null;
    if (value === null) {
      return null;
    }
    cells.push(value);
  }
  const entries = reader.eat(",") ? reader.table() : null;
  if (
    entries === null ||
    !reader.eat(",") ||
    !reader.eat("function") ||
    !reader.eat("(") ||
    !reader.eat("self") ||
    !reader.eat(")") ||
    !reader.atEnd()
  ) {
    return null;
  }
  const options = readOptions(entries, zoneOptionSchema);
  if (options === null) {
    return null;
  }
  const [x, y, w, h] = cells;
  return { name, kind, x, y, w, h, ...options };
}

export function zoneToLua(zone: Zone): string {
  if (!zoneKindList.includes(zone.kind)) {
    throw new Error(`Unknown zone kind "${zone.kind}"`);
  }
  const cells = [zone.x, zone.y, zone.w, zone.h].map(luaNumber).join(",");
  const options = writeOptions(zone, zoneOptionSchema, (key) =>
    zoneOptionDefault(zone.kind, key),
  );
  return `${ZONA_GLOBAL}.${zone.kind}(${luaString(zone.name)},${cells},${options},function(self)`;
}

// `_Z.tick(self,{ms=10})`, the Touch Tick block on the touch Timer.
// `_Z.tick(self)` parses too.
export function parseZoneTick(script: string): ZoneTick | null {
  const reader = new Reader(script);
  if (
    !reader.eat(ZONA_GLOBAL) ||
    !reader.eat(".") ||
    reader.identifier() !== "tick" ||
    !reader.eat("(") ||
    reader.identifier() !== "self"
  ) {
    return null;
  }
  const entries = reader.eat(",") ? reader.table() : [];
  if (entries === null || !reader.eat(")") || !reader.atEnd()) {
    return null;
  }
  return readOptions(entries, zoneTickSchema);
}

export function zoneTickToLua(tick: ZoneTick): string {
  const defaults: Record<string, ZoneOptionValue> = zoneTickDefaults;
  const options = writeOptions(tick, zoneTickSchema, (key) => defaults[key]);
  return `${ZONA_GLOBAL}.tick(self,${options})`;
}
