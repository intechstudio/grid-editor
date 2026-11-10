// Touch block scripts (docs/zona-touch-zones.md, The zone line). The lines, as
// the editor writes them, are chains: a constructor with the cells, then a call
// for each thing that isn't the default, in a fixed order:
//
//   _Z.xy(0,0,5,5).n("p1").col(255,0,0).gms(-1,176,40,-1,1).spr("50%")
//
// This is the form GridScript.compressScript produces: no spaces, double
// quotes, numbers in shortest form. The calls may come in any order when a
// line is read. The earlier positional line (_Z.zone) and option-table lines
// (_Z.fader, _Z.button) still read, and are written back as chains. Anything
// else parses to null and the block shows it as code.

import {
  type OptionSchema,
  type Zone,
  type ZoneKind,
  type ZoneOptionValue,
  zoneKindList,
  zoneOptionDefault,
  zoneOptionShown,
  zoneOutputs,
  type ZoneOptionSchema,
  zoneRead,
  zoneOptionValue,
  zoneOptionSchema,
} from "./zone-model";

// The global the touch blocks call (docs/zona-touch-zones.md, Where things run).
export const ZONA_GLOBAL = "_Z";
// The first thing in a zone block's script: it loads the library on the module.
// `gr` is the short name of library_load; the module caches the library, so
// every block can load it.
export const ZONA_LOAD = `${ZONA_GLOBAL}=gr("zona")`;

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

  mark(): number {
    return this.i;
  }

  reset(mark: number) {
    this.i = mark;
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

  // `(a,b,c)` as the raw text of each argument, in order.
  args(): string[] | null {
    if (!this.eat("(")) {
      return null;
    }
    const raws: string[] = [];
    if (this.eat(")")) {
      return raws;
    }
    for (;;) {
      const raw = this.value();
      if (raw === null) {
        return null;
      }
      raws.push(raw);
      if (this.eat(")")) {
        return raws;
      }
      if (!this.eat(",")) {
        return null;
      }
    }
  }

  // `{a,b,c}` as the raw text of each value, in order. A table with `name=`
  // entries is not a list.
  list(): string[] | null {
    if (!this.eat("{")) {
      return null;
    }
    const raws: string[] = [];
    while (!this.eat("}")) {
      const raw = this.value();
      if (raw === null || /^[A-Za-z_]\w*\s*=(?!=)/.test(raw)) {
        return null;
      }
      raws.push(raw);
      if (!this.eat(",") && !this.eat(";")) {
        if (!this.eat("}")) {
          return null;
        }
        break;
      }
    }
    return raws;
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

const COLOR_TABLE =
  /^\{\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*(?:,\s*\d*\.?\d+\s*)?\}$/;

// A colour as a table, `{red, green, blue}`, kept as "red,green,blue". A
// fourth value (the alpha of an earlier build) is read and dropped. The old
// "rrggbb" string still reads.
function colorLiteral(raw: string): string | null {
  const table = COLOR_TABLE.exec(raw.trim());
  if (table !== null) {
    return table.slice(1, 4).join(",");
  }
  const reader = new Reader(raw);
  const hex = reader.string();
  if (hex === null || !reader.atEnd() || !/^[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
}

// A raw table value as the schema's type, or null when it is not a plain
// literal of that type.
function literal(schema: OptionSchema, raw: string): ZoneOptionValue | null {
  if (schema.type === "color") {
    return colorLiteral(raw);
  }
  if (schema.type === "enum") {
    const reader = new Reader(raw);
    const value = reader.string();
    return value !== null && reader.atEnd() ? value : null;
  }
  return parseNumber(raw);
}

type Options = { opt: Record<string, ZoneOptionValue> };

// The options of an option-table line. The range and the host-MIDI switch of
// earlier builds are dropped (the range follows the command, host MIDI is
// always on); an option this editor doesn't know makes the line not a zone
// line.
function readOptions(
  entries: { key: string; raw: string }[],
  schema: OptionSchema[],
): Options | null {
  const opt: Record<string, ZoneOptionValue> = {};
  for (const { key, raw } of entries) {
    if (key === "min" || key === "max" || key === "rx" || key === "group") {
      continue;
    }
    const known = schema.find((e) => e.key === key);
    if (typeof known === "undefined") {
      return null;
    }
    const value = literal(known, raw);
    if (value === null) {
      return null;
    }
    opt[key] = value;
  }
  return { opt };
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

// The positional form: `_Z.zone(self,"f1",2,{0,0,5,5},{255,0,0},
// {0,-1,-1,0},{0,1,-1,0,0},{1,1,0})`. After the
// name and the type come tables, each a group of the face: geometry, colour,
// output, behaviour, capture. The options of a group are by position
// (zonePositions); a table may end early, and what it leaves out is the
// default.
// The type is a number in the line (shorter): 0 vertical fader, 1 horizontal
// fader, 2 XY pad, 3 button. The names are the editor's ("v", "h", "xy",
// "button"), and an older line with the name as a string still reads.
const ZONE_TYPES = ["v", "h", "xy", "button"];
// The output is one number, the msg and the command together: 0 CC, 1 CC
// 14-bit, 2 Note, 3 Pitch bend, 4 Mouse, 5 Gamepad. A mode or a grab is a
// number too: mode 0 abs, 1 rel; grab 0 focus, 1 live. An earlier build wrote
// these as strings, and an output as ("midi","cc",ch,num,rx); they still read.
const ENUM_CODES: { [key: string]: string[] } = {
  mode: ["abs", "rel"],
  grab: ["focus", "live"],
};
const zonePositions: string[][] = [
  ["out", "ch", "num", "rx"],
  ["mode", "sensitivity", "spring", "bmo", "group"],
  ["fingers", "tap", "grab"],
];

function readPositionalZone(reader: Reader): Zone | null {
  if (!reader.eat("(") || reader.identifier() !== "self" || !reader.eat(",")) {
    return null;
  }
  const name = reader.string();
  if (name === null || !reader.eat(",")) {
    return null;
  }
  const code = reader.number();
  const type = code !== null ? ZONE_TYPES[code] : reader.string();
  if (
    typeof type === "undefined" ||
    type === null ||
    !ZONE_TYPES.includes(type)
  ) {
    return null;
  }
  // the geometry, the colour, then the groups (output, behaviour, capture);
  // the earlier layout had a range table {min, max} after the output, which
  // is dropped: the range follows the command
  const tables: string[][] = [];
  for (;;) {
    const mark = reader.mark();
    const list = reader.eat(",") ? reader.list() : null;
    if (list === null) {
      reader.reset(mark);
      break;
    }
    tables.push(list);
  }
  if (tables.length === 6) {
    tables.splice(3, 1);
  }
  if (tables.length !== 5) {
    return null;
  }
  const [cells, color, ...groups] = tables;
  const numbers = cells.map(parseNumber);
  if (
    cells.length !== 4 ||
    numbers.some((e) => e === null) ||
    color.length > 4
  ) {
    return null;
  }
  const kind: ZoneKind = type === "button" ? "button" : "fader";
  const opt: Record<string, ZoneOptionValue> = {};
  if (kind === "fader") {
    opt.dir = type;
  }
  if (color.length > 0) {
    const col = colorLiteral(`{${color.join(",")}}`);
    if (col === null) {
      return null;
    }
    opt.col = col;
  }
  for (let g = 0; g < groups.length; g++) {
    // an output that starts with a string is the earlier five-slot form
    const keys =
      g === 0 && /^["']/.test(groups[0][0] ?? "")
        ? ["msg", "cmd", "ch", "num", "rx"]
        : zonePositions[g];
    if (groups[g].length > keys.length) {
      return null;
    }
    for (let i = 0; i < groups[g].length; i++) {
      const key = keys[i];
      const raw = groups[g][i];
      if (key === "rx" || key === "group") {
        continue; // host MIDI is always on; the radio group is gone
      }
      if (key === "out") {
        const output = zoneOutputs[parseNumber(raw) ?? -1];
        if (typeof output === "undefined") {
          return null;
        }
        opt.msg = output.msg;
        if (typeof output.cmd !== "undefined") {
          opt.cmd = output.cmd;
        }
        continue;
      }
      const schema = zoneOptionSchema.find((e) => e.key === key);
      const code = key in ENUM_CODES ? parseNumber(raw) : null;
      const value =
        code !== null
          ? (ENUM_CODES[key][code] ?? null)
          : schema
            ? literal(schema, raw)
            : null;
      if (value === null) {
        return null;
      }
      opt[key] = value;
    }
  }
  // Every slot is always written, so a slot the zone's reader has no use for
  // (a button's spring, a fader's fingers) holds its default and means
  // nothing: it is not an option of this zone, and not a problem to report.
  const read = zoneRead({ kind, opt });
  for (const key of Object.keys(opt)) {
    const schema = zoneOptionSchema.find((e) => e.key === key);
    if (key !== "dir" && schema && !schema.reads.includes(read)) {
      delete opt[key];
    }
  }
  if (reader.eat(",")) {
    const entries = reader.table();
    const rest =
      entries === null ? null : readOptions(entries, zoneOptionSchema);
    if (rest === null) {
      return null;
    }
    Object.assign(opt, rest.opt);
  }
  if (!reader.eat(")")) {
    return null;
  }
  const [x, y, w, h] = numbers as number[];
  return { name, kind, x, y, w, h, opt };
}

// The chain: a constructor with the cells (v and h faders, an XY pad, a
// button), then calls that each set one thing. A call this editor doesn't know,
// or one with arguments that don't fit, makes the line not a zone line.
const CONSTRUCTORS: { [name: string]: { kind: ZoneKind; dir?: string } } = {
  v: { kind: "fader", dir: "v" },
  h: { kind: "fader", dir: "h" },
  xy: { kind: "fader", dir: "xy" },
  b: { kind: "button" },
};

// MIDI by gms(ch, cmd, p1, p2, mode): the command is 144 (note), 224 (pitch
// bend) or 176 (a CC), and mode 1, 2, 3 make a 14-bit CC, an NRPN and an NRPN
// with a 14-bit value.
function midiCommand(cmd: number, mode: number, kind: ZoneKind): string | null {
  if (cmd === 144 || cmd === 128) {
    return "note";
  }
  if (cmd === 224) {
    return "pb";
  }
  if (cmd !== -1 && cmd !== 176) {
    return null;
  }
  if (mode === 0) {
    return cmd === -1 && kind === "button" ? "note" : "cc";
  }
  return ["cc", "cc14", "nrpn", "nrpn14"][mode] ?? null;
}

// One call of the chain applied to the zone; false when it doesn't fit.
function applyCall(zone: Zone, call: string, raws: string[]): boolean {
  const num = (i: number) =>
    i < raws.length ? parseNumber(raws[i]) : undefined;
  const nums = raws.map(parseNumber);
  if (nums.some((e) => e === null) && call !== "n" && call !== "spr") {
    return false;
  }
  const opt = zone.opt;
  switch (call) {
    case "n": {
      const reader = new Reader(raws[0] ?? "");
      const name = reader.string();
      if (raws.length !== 1 || name === null || !reader.atEnd()) {
        return false;
      }
      zone.name = name;
      return true;
    }
    case "col": {
      if (raws.length > 3) {
        return false;
      }
      opt.col = [0, 1, 2].map((i) => num(i) ?? -1).join(",");
      return true;
    }
    case "gms": {
      const cmd = midiCommand(num(1) ?? -1, num(4) ?? 0, zone.kind);
      if (cmd === null || raws.length > 5) {
        return false;
      }
      opt.msg = "midi";
      opt.cmd = cmd;
      opt.ch = num(0) ?? -1;
      opt.num = num(2) ?? -1;
      return true;
    }
    case "mo": {
      opt.msg = "mouse";
      opt.num = num(0) ?? -1;
      delete opt.cmd;
      return raws.length <= 1;
    }
    case "ga": {
      opt.msg = "pad";
      opt.num = num(0) ?? -1;
      delete opt.cmd;
      return raws.length <= 1;
    }
    case "mode":
      opt.mode = num(0) === 1 ? "rel" : "abs";
      return raws.length === 1;
    case "sens":
      opt.sensitivity = num(0) ?? 1;
      return raws.length === 1;
    case "spr": {
      // "50%" or 50
      const value = /^\s*["'](-?\d+)\s*%?["']\s*$/.exec(raws[0] ?? "");
      const spring = value !== null ? Number(value[1]) : num(0);
      if (
        raws.length !== 1 ||
        spring === null ||
        typeof spring === "undefined"
      ) {
        return false;
      }
      opt.spring = spring;
      return true;
    }
    case "cap":
      opt.grab = num(0) === 1 ? "live" : "focus";
      return raws.length === 1;
    case "fing":
      opt.fingers = num(0) ?? 1;
      return raws.length === 1;
    case "tog":
      opt.bmo = num(0) ?? 0;
      return raws.length === 1;
    case "grp":
      return raws.length === 1; // the radio group is gone; an old line still reads
    case "tap":
      opt.tap = num(0) ?? 1;
      return raws.length === 1;
    default:
      return false;
  }
}

function readChain(reader: Reader, name: string): Zone | null {
  const cells = reader.args()?.map(parseNumber);
  if (
    typeof cells === "undefined" ||
    cells.length !== 4 ||
    cells.some((e) => e === null)
  ) {
    return null;
  }
  const { kind, dir } = CONSTRUCTORS[name];
  const [x, y, w, h] = cells as number[];
  const zone: Zone = {
    name: "",
    kind,
    x,
    y,
    w,
    h,
    opt: typeof dir === "undefined" ? {} : { dir },
  };
  while (reader.eat(".")) {
    const call = reader.identifier();
    const raws = reader.args();
    if (call === null || raws === null || !applyCall(zone, call, raws)) {
      return null;
    }
  }
  dropUnused(zone);
  return zone;
}

// A call a zone has no use for (a button's .spr, a fader's .fing) is not an
// option of this zone and not a problem to report.
function dropUnused(zone: Zone) {
  const read = zoneRead(zone);
  for (const key of Object.keys(zone.opt)) {
    const schema = zoneOptionSchema.find((e) => e.key === key);
    if (key !== "dir" && schema && !schema.reads.includes(read)) {
      delete zone.opt[key];
    }
  }
}

// One zone line from the reader's position; null when it isn't a zone line.
function readZone(reader: Reader): Zone | null {
  if (!reader.eat(ZONA_GLOBAL) || !reader.eat(".")) {
    return null;
  }
  const word = reader.identifier() ?? "";
  if (word === "zone") {
    return readPositionalZone(reader);
  }
  if (word in CONSTRUCTORS) {
    return readChain(reader, word);
  }
  const kind = word as ZoneKind;
  if (
    !zoneKindList.includes(kind) ||
    !reader.eat("(") ||
    reader.identifier() !== "self" ||
    !reader.eat(",")
  ) {
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
  if (entries === null || !reader.eat(")")) {
    return null;
  }
  const options = readOptions(entries, zoneOptionSchema);
  if (options === null) {
    return null;
  }
  const [x, y, w, h] = cells;
  return { name, kind, x, y, w, h, ...options };
}

// `_Z.fader(self,"f1",0,0,1,9,{res=10})`, a single zone line. Returns null
// when the script is not exactly one zone line.
export function parseZone(script: string): Zone | null {
  const reader = new Reader(script);
  const zone = readZone(reader);
  return zone !== null && reader.atEnd() ? zone : null;
}

// The `_Z=gr("zona")` that starts a block's script. Optional on reading, so
// a script from before the block loaded the library itself still parses (and
// gets it the next time the block writes it).
function readLoad(reader: Reader) {
  const mark = reader.mark();
  if (!(
    reader.eat(ZONA_GLOBAL) &&
    reader.eat("=") &&
    reader.identifier() === "gr" &&
    reader.eat("(") &&
    reader.string() === "zona" &&
    reader.eat(")")
  )) {
    reader.reset(mark);
  }
}

// The zone block's script: one or more zone lines, one after the other. Null
// when any part of it is not a zone line.
export function parseZones(script: string): Zone[] | null {
  const reader = new Reader(script);
  readLoad(reader);
  const zones: Zone[] = [];
  do {
    const zone = readZone(reader);
    if (zone === null) {
      return null;
    }
    zones.push(zone);
  } while (!reader.atEnd());
  return zones;
}

// The zones of the zone blocks among these action scripts, in order.
export function zonesOf(scripts: string[]): Zone[] {
  return scripts.flatMap((e) => parseZones(e) ?? []);
}

export function zonesToLua(zones: Zone[]): string {
  return [ZONA_LOAD, ...zones.map(zoneToLua)].join(" ");
}

// The zone line as the editor writes it: the constructor with the cells, the
// name (when the zone has one), then a call for each thing that isn't the
// default and that the zone uses, in this order:
//
//   _Z.xy(0,0,5,5).n("p1").col(255,0,0).gms(-1,176,40,-1,1).spr("50%")
//
// .n, .col, the output (.gms for MIDI, .mo for the mouse, .ga for the
// gamepad), then .mode, .sens, .spr, .tog, .fing, .tap and .cap.
export function zoneToLua(zone: Zone): string {
  if (!zoneKindList.includes(zone.kind)) {
    throw new Error(`Unknown zone kind "${zone.kind}"`);
  }
  const known = new Set(zoneOptionSchema.map((e) => e.key));
  for (const key of Object.keys(zone.opt)) {
    if (!known.has(key)) {
      throw new Error(`Unknown option "${key}"`);
    }
  }
  const read = zoneRead(zone);
  const msg = zoneOptionValue(zone, "msg");
  // the value of an option the zone uses and the line doesn't leave at its
  // default, or undefined
  const given = (key: string) => {
    const schema = zoneOptionSchema.find(
      (e) => e.key === key,
    ) as ZoneOptionSchema;
    const value = zoneOptionValue(zone, key);
    const used =
      schema.reads.includes(read) && zoneOptionShown(schema, msg, zone);
    return used && value !== zoneOptionDefault(zone.kind, key)
      ? value
      : undefined;
  };
  const constructor =
    zone.kind === "button" ? "b" : String(zone.opt.dir ?? "v");
  if (!(constructor in CONSTRUCTORS)) {
    throw new Error(`Unknown zone type "${constructor}"`);
  }
  let line = `${ZONA_GLOBAL}.${constructor}(${[zone.x, zone.y, zone.w, zone.h]
    .map(luaNumber)
    .join(",")})${zone.name === "" ? "" : `.n(${luaString(zone.name)})`}`;
  const col = String(zoneOptionValue(zone, "col"));
  if (col !== "-1,-1,-1") {
    line += `.col(${col})`;
  }
  const ch = Number(zoneOptionValue(zone, "ch"));
  const num = Number(zoneOptionValue(zone, "num"));
  const cmd = String(zoneOptionValue(zone, "cmd"));
  if (msg === "mouse") {
    line += `.mo(${num === 1 || num < 0 ? "" : num})`;
  } else if (msg === "pad") {
    line += `.ga(${num < 0 ? "" : num})`;
  } else if (
    cmd !== zoneOptionDefault(zone.kind, "cmd") ||
    ch !== -1 ||
    num !== -1
  ) {
    const code = {
      cc: [176, 0],
      cc14: [176, 1],
      note: [144, 0],
      pb: [224, 0],
      nrpn: [176, 2],
      nrpn14: [176, 3],
    }[cmd];
    if (typeof code === "undefined") {
      throw new Error(`Unknown command "${cmd}"`);
    }
    line += `.gms(${ch},${code[0]},${num},-1${code[1] > 0 ? `,${code[1]}` : ""})`;
  }
  if (given("mode") === "rel") {
    line += ".mode(1)";
  }
  const sens = given("sensitivity");
  if (typeof sens === "number") {
    line += `.sens(${luaNumber(sens)})`;
  }
  const spring = given("spring");
  if (typeof spring === "number" && spring >= 0) {
    line += `.spr("${luaNumber(spring)}%")`;
  }
  const bmo = given("bmo");
  if (typeof bmo === "number") {
    line += `.tog(${luaNumber(bmo)})`;
  }
  const fingers = given("fingers");
  if (typeof fingers === "number") {
    line += `.fing(${luaNumber(fingers)})`;
  }
  const tap = given("tap");
  if (typeof tap === "number") {
    line += `.tap(${luaNumber(tap)})`;
  }
  if (given("grab") === "live") {
    line += ".cap(1)";
  }
  return line;
}
