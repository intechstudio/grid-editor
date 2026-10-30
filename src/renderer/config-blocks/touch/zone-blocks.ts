// What the Touch blocks need besides the model: block shorts, the script a new
// zone block starts with, the untoggled header text, and the face's fields
// from the option schema (docs/zona-touch-zones.md, Block face).

import {
  type OptionSchema,
  type Zone,
  type ZoneKind,
  type ZoneOptionSchema,
  type ZoneOptionValue,
  type ZoneRead,
  type ZoneSection,
  zoneOptionDefault,
  zoneOptionSchemaFor,
  zoneOptionShown,
  zoneRead,
  zoneSections,
  zoneSends,
} from "./zone-model";
import { parseZones, zonesOf, zonesToLua, zoneToLua } from "./zone-parse";
import { type ZoneMidi, PAD_AXIS_NAMES } from "./zone-autos";
import { midiCC } from "../_midi.js";
import { MusicalNotes } from "../../main/panels/MidiMonitor/midi-types";

export const zoneBlockShort: Record<ZoneKind, string> = {
  fader: "zfd",
  button: "zbt",
};

// Default names are the prefix plus the next free number: f1, b1, p1.
const NAME_PREFIX: Record<ZoneKind, string> = {
  fader: "f",
  button: "b",
};

// Cells a new zone gets. Placing it on the first free spot is a later step.
const DEFAULT_CELLS: Record<ZoneKind, [number, number]> = {
  fader: [5, 5],
  button: [2, 2],
};

// Options a new zone starts with, beyond the library's defaults: a new fader
// is an XY pad. A line without the option still means the library default.
const DEFAULT_OPT: Record<ZoneKind, Zone["opt"]> = {
  fader: { dir: "xy" },
  button: {},
};

// The first name prefix+n that none of these names has.
function freeName(kind: ZoneKind, used: Set<string>): string {
  let n = 1;
  while (used.has(`${NAME_PREFIX[kind]}${n}`)) {
    n++;
  }
  return `${NAME_PREFIX[kind]}${n}`;
}

// The first name prefix+n that no zone in these scripts uses.
export function defaultZoneName(kind: ZoneKind, scripts: string[]): string {
  return freeName(kind, new Set(zonesOf(scripts).map((e) => e.name)));
}

// The first select of the block: what the zone is. The three directions are
// a fader (dir), a button is its own kind of line.
export type ZoneType = "v" | "h" | "xy" | "button";

const ZONE_TYPES: readonly string[] = ["v", "h", "xy", "button"];

export const zoneTypeSchema: OptionSchema = {
  key: "dir",
  type: "enum",
  values: ZONE_TYPES,
};

export function zoneType(zone: Pick<Zone, "kind" | "opt">): ZoneType {
  if (zone.kind === "button") {
    return "button";
  }
  return zone.opt.dir === "h" || zone.opt.dir === "xy" ? zone.opt.dir : "v";
}

// The zone's colour as CSS ("rgb(255,128,0)"): its `col`, with the module's
// colour for a channel at -1 (auto). Undefined when a channel can't be known.
export function zoneCssColor(
  zone: Pick<Zone, "opt">,
  auto?: { red?: number; green?: number; blue?: number },
): string | undefined {
  const [red, green, blue] = String(zone.opt.col ?? "-1,-1,-1,1")
    .split(",")
    .map(Number);
  const channels = [
    red === -1 ? auto?.red : red,
    green === -1 ? auto?.green : green,
    blue === -1 ? auto?.blue : blue,
  ];
  return channels.every((e) => typeof e === "number" && Number.isFinite(e))
    ? `rgb(${channels.join(",")})`
    : undefined;
}

// The type as the Type select titles it: "XY Pad", "Button".
export function zoneTypeLabel(zone: Pick<Zone, "kind" | "opt">): string {
  return enumValueLabels.dir[zoneType(zone)];
}

// The zone as another type. The options the new type has no field for go (a
// button's mode, a fader's spring), and so does a command it can't send; a
// default name (f1, b1) becomes the next free one of the new kind.
export function withZoneType(
  zone: Zone,
  type: string,
  otherScripts: string[],
): Zone {
  if (!ZONE_TYPES.includes(type) || type === zoneType(zone)) {
    return zone;
  }
  const kind: ZoneKind = type === "button" ? "button" : "fader";
  const next: Zone = { ...zone, kind, opt: { ...zone.opt } };
  delete next.opt.dir;
  const allowed = new Map(
    zoneOptionSchemaFor(next)
      .filter((e) => e.reads.includes(zoneRead(next)) || e.key === "dir")
      .map((e) => [e.key, e]),
  );
  for (const [key, value] of Object.entries(next.opt)) {
    const schema = allowed.get(key);
    if (
      typeof schema === "undefined" ||
      (schema.type === "enum" && !schema.values.includes(String(value)))
    ) {
      delete next.opt[key];
    }
  }
  if (kind === "fader" && type !== "v") {
    next.opt.dir = type;
  }
  if (
    kind !== zone.kind &&
    new RegExp(`^${NAME_PREFIX[zone.kind]}\\d+$`).test(zone.name)
  ) {
    next.name = defaultZoneName(kind, otherScripts);
  }
  return next;
}

const GRID = 9;

// Whether cells are on the surface and free of every one of `zones`.
function cellsFree(zones: Zone[]) {
  const taken = Array.from({ length: GRID }, () =>
    new Array<boolean>(GRID).fill(false),
  );
  for (const zone of zones) {
    for (
      let y = Math.max(0, zone.y);
      y < Math.min(GRID, zone.y + zone.h);
      y++
    ) {
      for (
        let x = Math.max(0, zone.x);
        x < Math.min(GRID, zone.x + zone.w);
        x++
      ) {
        taken[y][x] = true;
      }
    }
  }
  return (x: number, y: number, w: number, h: number) => {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (i < 0 || j < 0 || i >= GRID || j >= GRID || taken[j][i]) {
          return false;
        }
      }
    }
    return true;
  };
}

// A copy of `source` with the next free name, to the right of `anchor`, else
// below it, where its cells are on the surface and free of every zone in
// `zones` (all the zones of the Setup). Undefined when neither fits.
export function placedCopy(
  source: Zone,
  anchor: Zone,
  zones: Zone[],
): Zone | undefined {
  const { x, y, w, h } = anchor;
  if (![x, y, w, h].every(Number.isInteger) || w <= 0 || h <= 0) {
    return undefined;
  }
  const free = cellsFree(zones);
  const name = freeName(source.kind, new Set(zones.map((e) => e.name)));
  for (const [nx, ny] of [
    [x + w, y],
    [x, y + h],
  ]) {
    if (free(nx, ny, source.w, source.h)) {
      return { ...source, opt: { ...source.opt }, name, x: nx, y: ny };
    }
  }
  return undefined;
}

// The zone Add Zone adds, or undefined when the surface has no room for any:
// a copy of the selected zone beside it (placedCopy), else a 1x1 button with
// the default options on the first free cell, reading left to right, top to
// bottom.
export function addedZone(selected: Zone, zones: Zone[]): Zone | undefined {
  const copy = placedCopy(selected, selected, zones);
  if (typeof copy !== "undefined") {
    return copy;
  }
  const free = cellsFree(zones);
  const used = new Set(zones.map((e) => e.name));
  for (let ny = 0; ny < GRID; ny++) {
    for (let nx = 0; nx < GRID; nx++) {
      if (free(nx, ny, 1, 1)) {
        return {
          name: freeName("button", used),
          kind: "button",
          x: nx,
          y: ny,
          w: 1,
          h: 1,
          opt: { ...DEFAULT_OPT.button },
        };
      }
    }
  }
  return undefined;
}

export function defaultZone(kind: ZoneKind, scripts: string[]): Zone {
  const [w, h] = DEFAULT_CELLS[kind];
  return {
    name: defaultZoneName(kind, scripts),
    kind,
    x: 0,
    y: 0,
    w,
    h,
    opt: { ...DEFAULT_OPT[kind] },
  };
}

export function defaultZoneScript(kind: ZoneKind, scripts: string[]): string {
  return zoneToLua(defaultZone(kind, scripts));
}

// Untoggled header: "f1 · 0,0 1×9", with what it sends when known:
// "f1 · 0,0 1×9 · CC 32 ch 1" (zoneOutputLabel).
export function zoneHeaderText(zone: Zone, midi?: string): string {
  const text = `${zone.name} · ${zone.x},${zone.y} ${zone.w}×${zone.h}`;
  return typeof midi === "undefined" ? text : `${text} · ${midi}`;
}

export type ZoneFaceSection = {
  section: ZoneSection;
  options: ZoneOptionSchema[];
};

// The zone's output: its msg, or the kind's default.
export function zoneMsg(zone: Zone): ZoneOptionValue | undefined {
  return zone.opt.msg ?? zoneOptionDefault(zone.kind, "msg");
}

// The face's option sections for a zone, in display order: the options of
// its kind and output. Geometry is listed even without options: the face
// puts x, y, w, h there.
export function zoneFaceSections(zone: Zone): ZoneFaceSection[] {
  const msg = zoneMsg(zone);
  return zoneSections
    .map((section) => ({
      section,
      options: zoneOptionSchemaFor(zone).filter(
        (e) =>
          e.section === section &&
          e.reads.includes(zoneRead(zone)) &&
          zoneOptionShown(e, msg),
      ),
    }))
    .filter((e) => e.section === "geometry" || e.options.length > 0);
}

// Field text of an option: its value, or empty when the line leaves it out.
export function optionText(value: ZoneOptionValue | undefined): string {
  return typeof value === "undefined" ? "" : String(value);
}

// Shown in an empty field: what the zone uses without the option.
export function optionPlaceholder(zone: Zone, key: string): string {
  const kind = zone.kind;
  if (key === "num" && zoneMsg(zone) === "mouse") {
    return "1 (Left)";
  }
  if (key === "min") {
    return "0";
  }
  if (key === "max") {
    return "127 or 16383";
  }
  if (key === "ch" || key === "num") {
    return "auto";
  }
  if (key === "col") {
    return "module default";
  }
  if (key === "spring") {
    return "off";
  }
  return optionText(zoneOptionDefault(kind, key));
}

export type EnumOption = { title: string; value: string };

// Select titles of enum values.
const enumValueLabels: Record<string, Record<string, string>> = {
  dir: { v: "Vertical", h: "Horizontal", xy: "XY Pad", button: "Button" },
  msg: { midi: "MIDI" },
  cmd: { cc: "CC", cc14: "CC 14-bit", note: "Note", pb: "Pitch bend" },
  mode: { abs: "Absolute", rel: "Relative" },
  grab: { focus: "Focus", live: "Live" },
};

// What a mouse or gamepad zone of each kind is, as its Output title.
const zoneKindTitles: Record<string, Record<ZoneRead, string>> = {
  mouse: { axis: "Mouse wheel", gate: "Mouse button", point: "Mouse" },
  pad: { axis: "Gamepad axis", gate: "Gamepad button", point: "Gamepad" },
};

// Select entries of an enum option: the schema's values; the zone's default
// is selected when the line leaves the option out. A value the schema doesn't
// know (a newer editor's, a hand-written line) is listed too, so the select
// shows what the line says and nothing is rewritten until the user picks
// something. The reader names its mouse and gamepad outputs.
export function enumOptions(
  schema: OptionSchema,
  value: string,
  read?: ZoneRead,
): EnumOption[] {
  if (schema.type !== "enum") {
    return [];
  }
  const labels: Record<string, string> = { ...enumValueLabels[schema.key] };
  if (schema.key === "msg" && typeof read !== "undefined") {
    for (const [msg, titles] of Object.entries(zoneKindTitles)) {
      labels[msg] = titles[read];
    }
  }
  const options = schema.values.map((e) => ({
    title: labels[e] ?? e,
    value: e,
  }));
  if (value !== "" && !schema.values.includes(value)) {
    options.push({ title: `${value} (unknown)`, value });
  }
  return options;
}

export type OptionSuggestion = { value: string; info: string };

const OFF_ON: OptionSuggestion[] = [
  { value: "0", info: "Off" },
  { value: "1", info: "On" },
];

// gmbs buttons, no auto: a mouse button presses Left without num.
const MOUSE_BUTTONS: OptionSuggestion[] = [
  { value: "1", info: "Left" },
  { value: "2", info: "Right" },
  { value: "4", info: "Middle" },
];

// Values offered in a number field, like the MIDI block's lists: channels,
// CC names or notes with the auto value first, and the common values of the
// other options. `midi` is what the zone sends (zone-autos.ts).
export function zoneOptionSuggestions(
  zone: Zone,
  key: string,
  midi?: ZoneMidi | null,
): OptionSuggestion[] {
  const sends = zoneSends(zone);
  switch (key) {
    case "ch":
      return [
        {
          value: "-1",
          info: midi ? `Auto (channel ${midi.ch + 1})` : "Auto",
        },
        ...Array.from({ length: 16 }, (_, i) => ({
          value: String(i),
          info: `Channel ${i + 1}`,
        })),
      ];
    case "num": {
      if (sends === "mouse") {
        return MOUSE_BUTTONS;
      }
      const auto = midi?.nums[0];
      if (sends === "pad") {
        const button = zone.kind === "button";
        const name = (n: number) =>
          button ? `Button ${n}` : `${PAD_AXIS_NAMES[n] ?? n} Axis`;
        return [
          {
            value: "-1",
            info: typeof auto === "number" ? `Auto (${name(auto)})` : "Auto",
          },
          ...Array.from({ length: button ? 32 : 6 }, (_, i) => ({
            value: String(i),
            info: name(i),
          })),
        ];
      }
      if (sends === "note") {
        return [
          {
            value: "-1",
            info:
              typeof auto === "number"
                ? `Auto (${MusicalNotes.FromInt(auto)})`
                : "Auto",
          },
          ...Array.from({ length: 128 }, (_, i) => ({
            value: String(i),
            info: MusicalNotes.FromInt(i),
          })),
        ];
      }
      if (sends === "cc") {
        return [
          {
            value: "-1",
            info: typeof auto === "number" ? `Auto (${auto})` : "Auto",
          },
          ...Object.entries(midiCC as Record<string, string>).map(
            ([value, info]) => ({ value, info }),
          ),
        ];
      }
      return [];
    }
    case "min":
      return [{ value: "0", info: "Lowest" }];
    case "max":
      return [
        { value: "127", info: "7 bit" },
        { value: "16383", info: "14 bit" },
      ];
    case "spring":
      return [
        { value: "-1", info: "Off" },
        { value: "0", info: "0% (minimum)" },
        { value: "50", info: "50% (centre)" },
        { value: "100", info: "100% (maximum)" },
      ];
    case "rx":
    case "tap":
      return OFF_ON;
    case "bmo":
      return [
        { value: "0", info: "Momentary" },
        { value: "1", info: "Toggle" },
      ];
    case "group":
      return [
        { value: "0", info: "None" },
        ...Array.from({ length: 8 }, (_, i) => ({
          value: String(i + 1),
          info: `Group ${i + 1}`,
        })),
      ];
    case "fingers":
      return Array.from({ length: 5 }, (_, i) => ({
        value: String(i + 1),
        info: i === 0 ? "1 finger" : `${i + 1} fingers`,
      }));
    default:
      return [];
  }
}

// Parses a field's text into an option value. Empty means "leave it out"
// (undefined). A number field that isn't a number gives an error.
export function parseOptionText(
  schema: OptionSchema,
  text: string,
): { value?: ZoneOptionValue; error?: string } {
  const trimmed = text.trim();
  if (trimmed === "") {
    return {};
  }
  if (schema.type === "enum") {
    return { value: trimmed };
  }
  if (schema.type === "color") {
    return { value: trimmed.replace(/[{}\s]/g, "") };
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? { value } : { error: "Enter a number" };
}

// A zone with one option set from field text, or an error when
// the text can't be written at all (range and enum problems are the
// validators' job).
export function withOption<T extends { opt: Record<string, ZoneOptionValue> }>(
  target: T,
  schema: OptionSchema,
  text: string,
): { next?: T; error?: string } {
  const { value, error } = parseOptionText(schema, text);
  if (typeof error !== "undefined") {
    return { error };
  }
  const opt = { ...target.opt };
  if (typeof value === "undefined") {
    delete opt[schema.key];
  } else {
    opt[schema.key] = value;
  }
  return { next: { ...target, opt } };
}

export type ZoneField = "name" | "x" | "y" | "w" | "h";

// The zone with a name or geometry field set from text.
export function withField(
  zone: Zone,
  field: ZoneField,
  text: string,
): { next?: Zone; error?: string } {
  if (field === "name") {
    return /["\\\n\r]/.test(text)
      ? { error: "No quotes or backslashes" }
      : { next: { ...zone, name: text } };
  }
  const value = Number(text.trim());
  if (text.trim() === "" || !Number.isFinite(value)) {
    return { error: "Enter a number" };
  }
  return { next: { ...zone, [field]: value } };
}

// Field titles of the options.
export const optionLabels: Record<string, string> = {
  dir: "Direction",
  min: "Min",
  max: "Max",
  mode: "Mode",
  sensitivity: "Sensitivity",
  bmo: "Button mode",
  spring: "Spring to",
  fingers: "Fingers (one channel each)",
  group: "Radio group",
  grab: "Capture",
  col: "Colour",
  msg: "Output",
  cmd: "Command",
  ch: "Channel",
  num: "CC",
  rx: "Receive MIDI",
  tap: "Tap to click",
};

// The field title; the number is a CC, a note, a mouse button or a gamepad
// axis or button, by what the zone sends.
export function optionLabel(key: string, zone?: Zone): string {
  if (key === "num" && typeof zone !== "undefined") {
    const sends = zoneSends(zone);
    if (sends === "pad") {
      return zone.kind === "button" ? "Button" : "Axis";
    }
    return sends === "note" ? "Note" : sends === "mouse" ? "Button" : "CC";
  }
  return optionLabels[key] ?? key;
}

// A zone line pasted, dropped or loaded next to these scripts: when its name
// is already used by a zone there, it gets the next free name of its kind.
// zona.lua treats a repeated pending name as a new Setup run, so a duplicate
// would drop the zones before it (docs/zona-touch-zones.md, Setup and going live).
export function uniqueZoneScript(script: string, others: string[]): string {
  const zones = parseZones(script);
  if (zones === null) {
    return script;
  }
  const used = new Set(zonesOf(others).map((e) => e.name));
  let renamed = false;
  const next = zones.map((zone) => {
    if (!used.has(zone.name)) {
      used.add(zone.name);
      return zone;
    }
    renamed = true;
    const name = freeName(zone.kind, used);
    used.add(name);
    return { ...zone, name };
  });
  return renamed ? zonesToLua(next) : script;
}
