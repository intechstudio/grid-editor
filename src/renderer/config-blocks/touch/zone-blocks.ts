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
  zoneCmdValues,
  zoneMsgValues,
  zoneOptionDefault,
  zoneOptionSchemaFor,
  zoneOptionShown,
  zoneOutputCode,
  zoneOutputOrder,
  zoneOutputs,
  zoneRead,
  zoneSections,
  zoneLabels,
  zoneSends,
  zoneTypeTitles,
  zoneOptionValue,
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
  const [red, green, blue] = String(zone.opt.col ?? "-1,-1,-1")
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

// The zone as another type. The settings the new type also has stay; the
// ones it doesn't have go back to their defaults, and so does the output
// (msg, cmd, num) only when the new type can't send it.
export function withZoneType(
  zone: Zone,
  type: string,
  _otherScripts: string[] = [],
): Zone {
  if (!ZONE_TYPES.includes(type) || type === zoneType(zone)) {
    return zone;
  }
  const kind: ZoneKind = type === "button" ? "button" : "fader";
  const oldRead = zoneRead(zone);
  const next: Zone = { ...zone, kind, opt: {} };
  if (kind === "fader" && type !== "v") {
    next.opt.dir = type;
  }
  const newRead = zoneRead(next);
  const schema = zoneOptionSchemaFor(next);
  for (const [key, value] of Object.entries(zone.opt)) {
    const option = schema.find((e) => e.key === key);
    if (
      key !== "dir" &&
      key !== "cmd" &&
      key !== "num" &&
      typeof option !== "undefined" &&
      option.reads.includes(newRead)
    ) {
      next.opt[key] = value;
    }
  }
  // the command: kept when the new type sends it, written out when the new
  // type's own default would otherwise change it
  const cmd = zoneOptionValue(zone, "cmd");
  const cmdSchema = schema.find((e) => e.key === "cmd");
  if (
    typeof cmd === "string" &&
    cmdSchema?.type === "enum" &&
    cmdSchema.values.includes(cmd)
  ) {
    if (cmd !== zoneOptionDefault(kind, "cmd")) {
      next.opt.cmd = cmd;
    }
  }
  // the number: what it means for a mouse or gamepad zone depends on the
  // type, and a MIDI one must still be in range with the command
  if (typeof zone.opt.num !== "undefined") {
    const numSchema = zoneOptionSchemaFor(next).find((e) => e.key === "num");
    const sends = zoneSends(next);
    const max =
      numSchema?.type === "integer" ? (numSchema.max ?? Infinity) : Infinity;
    if (
      (sends === "mouse" || sends === "pad"
        ? newRead === oldRead && kind === zone.kind
        : true) &&
      (zone.opt.num as number) <= max
    ) {
      next.opt.num = zone.opt.num;
    }
  }
  return next;
}

// The zone with every setting at its default, its type, name, position and
// size kept (the colour and the output go back too).
export function resetZone(zone: Zone): Zone {
  const dir = zone.opt.dir;
  return { ...zone, opt: typeof dir === "undefined" ? {} : { dir } };
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
  // a copy of a zone with a name gets the next free one; no name stays none
  const name =
    source.name === ""
      ? ""
      : freeName(source.kind, new Set(zones.map((e) => e.name)));
  const copy = (nx: number, ny: number): Zone => ({
    ...source,
    opt: { ...source.opt },
    name,
    x: nx,
    y: ny,
  });
  // to its right, else at the beginning of the next line below it (the first
  // row under it), as far left as there is room there, then the lines after
  if (free(x + w, y, source.w, source.h)) {
    return copy(x + w, y);
  }
  for (let ny = y + h; ny + source.h <= GRID; ny++) {
    for (let nx = 0; nx + source.w <= GRID; nx++) {
      if (free(nx, ny, source.w, source.h)) {
        return copy(nx, ny);
      }
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
  for (let ny = 0; ny < GRID; ny++) {
    for (let nx = 0; nx < GRID; nx++) {
      if (free(nx, ny, 1, 1)) {
        return {
          name: "",
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

// A new zone has no name: the editor shows the type and a number.
export function defaultZone(kind: ZoneKind, _scripts: string[]): Zone {
  const [w, h] = DEFAULT_CELLS[kind];
  return {
    name: "",
    kind,
    x: 0,
    y: 0,
    w,
    h,
    opt: { ...DEFAULT_OPT[kind] },
  };
}

export function defaultZoneScript(kind: ZoneKind, scripts: string[]): string {
  return zonesToLua([defaultZone(kind, scripts)]);
}

// Untoggled header: "f1 · 0,0 1×9", with what it sends when known:
// "f1 · 0,0 1×9 · CC 32 ch 1" (zoneOutputLabel). `label` is the zone's name
// as the editor shows it (zoneLabels): its own, or the type and a number.
export function zoneHeaderText(
  zone: Zone,
  midi?: string,
  label?: string,
): string {
  const text = `${label ?? zone.name} · ${zone.x},${zone.y} ${zone.w}×${zone.h}`;
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
      options: zoneOptionSchemaFor(zone)
        .filter(
          (e) =>
            e.section === section &&
            e.reads.includes(zoneRead(zone)) &&
            zoneOptionShown(e, msg, zone),
        )
        // The Output and the Command are one select, "out": the numbers of
        // zoneOutputs the zone can have (the others are not listed). The
        // Command field is not shown.
        .filter((e) => e.key !== "cmd")
        .map((e) =>
          e.key === "msg"
            ? {
                ...e,
                key: "out",
                // only the outputs the zone can take, and the one it has even if
                // it can't (a line written by hand), so the select shows it
                values: zoneOutputOrder
                  .map(String)
                  .filter(
                    (e) =>
                      zoneOutputValues(zone).includes(e) ||
                      e === String(zoneOutputCode(zone)),
                  ),
              }
            : e,
        ),
    }))
    .filter((e) => e.section === "geometry" || e.options.length > 0);
}

// The outputs a zone of this kind and reader can have, as the numbers of
// zoneOutputs: the commands it can send, and the mouse and gamepad. The
// select lists every output and dims the others.
export function zoneOutputValues(zone: Zone): string[] {
  const cmds: readonly string[] =
    zoneRead(zone) === "point"
      ? ["cc", "cc14", "nrpn", "nrpn14"]
      : zoneCmdValues[zone.kind];
  const msgs: readonly string[] = zoneMsgValues[zone.kind];
  return zoneOutputs
    .map((e, i) => ({ e, i }))
    .filter(({ e }) =>
      e.msg === "midi"
        ? msgs.includes("midi") && cmds.includes(e.cmd as string)
        : msgs.includes(e.msg),
    )
    .map(({ i }) => String(i));
}

// The zone with an output picked: its number in zoneOutputs. A command brings
// its own range, 0-127 or 0-16383 (CC 14-bit, pitch bend); the mouse and the
// gamepad have no command.
export function withOutput(zone: Zone, code: string): Zone {
  const output = zoneOutputs[Number(code)];
  if (typeof output === "undefined" || !zoneOutputValues(zone).includes(code)) {
    return zone;
  }
  const opt: Record<string, ZoneOptionValue> = {
    ...zone.opt,
    msg: output.msg,
  };
  delete opt.cmd;
  if (typeof output.cmd !== "undefined") {
    opt.cmd = output.cmd;
  }
  return { ...zone, opt };
}

// The number of the zone's output as the select's text.
export function zoneOutputText(zone: Zone): string {
  return String(zoneOutputCode(zone));
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
  if (key === "chy") {
    return "same as X";
  }
  if (key === "numy") {
    return "X + 1";
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

// What a number field shows: the option's value, or the default the library
// uses when the line leaves it out, so the field is never empty.
export function optionShownText(zone: Zone, schema: OptionSchema): string {
  return optionText(zoneOptionValue(zone, schema.key));
}

export type EnumOption = { title: string; value: string; disabled?: boolean };

// Select titles of enum values.
const enumValueLabels: Record<string, Record<string, string>> = {
  dir: zoneTypeTitles,
  msg: { midi: "MIDI" },
  cmd: {
    cc: "CC",
    cc14: "CC 14-bit",
    note: "Note",
    pb: "Pitch bend",
    nrpn: "NRPN",
    nrpn14: "NRPN 14-bit",
  },
  // the Output select: each MIDI command by its full name
  out: {
    cc: "MIDI CC",
    cc14: "MIDI 14",
    note: "MIDI Note",
    pb: "MIDI Pitchbend",
    nrpn: "MIDI NRPN",
    nrpn14: "MIDI NRPN 14",
  },
  mode: { abs: "Absolute", rel: "Relative" },
  grab: { focus: "Focus", live: "Live" },
};

// What a mouse or gamepad zone of each kind is, as its Output title.
const zoneKindTitles: Record<string, Record<ZoneRead, string>> = {
  mouse: { axis: "Mouse wheel", gate: "Mouse button", point: "Mouse move" },
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
  if (schema.key === "out") {
    // the commands, then the mouse and the gamepad, named by the reader
    zoneOutputs.forEach((e, i) => {
      labels[String(i)] =
        e.msg === "midi"
          ? enumValueLabels.out[e.cmd as string]
          : zoneKindTitles[e.msg][read ?? "axis"];
    });
  }
  if (schema.key === "msg" && typeof read !== "undefined") {
    for (const [msg, titles] of Object.entries(zoneKindTitles)) {
      labels[msg] = titles[read];
    }
  }
  const unavailable = "unavailable" in schema ? (schema.unavailable ?? []) : [];
  const options = schema.values.map((e) => ({
    title: labels[e] ?? e,
    value: e,
    ...(unavailable.includes(e) ? { disabled: true } : {}),
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
// The buttons a mouse button zone can press, as a button-style radio group:
// Left (1) is the default, then Middle (4) and Right (2).
export type OptionChoice = { title: string; value: number };
const MOUSE_BUTTON_CHOICES: OptionChoice[] = [
  { title: "Left", value: 1 },
  { title: "Middle", value: 4 },
  { title: "Right", value: 2 },
];

// The option as a few buttons to pick from instead of a field: the button of a
// mouse button zone. Undefined for every other option.
export function zoneOptionChoices(
  zone: Zone,
  key: string,
): OptionChoice[] | undefined {
  return key === "num" && zoneSends(zone) === "mouse"
    ? MOUSE_BUTTON_CHOICES
    : undefined;
}

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
    case "chy":
      return [
        {
          value: "-1",
          info: midi ? `Same as X (channel ${midi.ch + 1})` : "Same as X",
        },
        ...Array.from({ length: 16 }, (_, i) => ({
          value: String(i),
          info: `Channel ${i + 1}`,
        })),
      ];
    case "numy": {
      // the numbers of x, with the auto one for what y takes without one
      const list = zoneOptionSuggestions(zone, "num", midi);
      const y = midi?.nums[1];
      return list.map((e, i) =>
        i === 0 && e.value === "-1"
          ? { ...e, info: typeof y === "number" ? `X + 1 (${y})` : "X + 1" }
          : e,
      );
    }
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
      if (sends === "nrpn" || sends === "nrpn14") {
        // an NRPN number is 0-16383
        return [
          {
            value: "-1",
            info: typeof auto === "number" ? `Auto (${auto})` : "Auto",
          },
        ];
      }
      if (sends === "cc" || sends === "cc14") {
        // a 14-bit CC is a pair, the number and the number + 32
        return [
          {
            value: "-1",
            info: typeof auto === "number" ? `Auto (${auto})` : "Auto",
          },
          ...Object.entries(midiCC as Record<string, string>)
            .filter(([value]) => sends === "cc" || Number(value) < 32)
            .map(([value, info]) => ({ value, info })),
        ];
      }
      return [];
    }
    case "spring":
      return [
        { value: "-1", info: "Off" },
        { value: "0", info: "0% (minimum)" },
        { value: "50", info: "50% (centre)" },
        { value: "100", info: "100% (maximum)" },
      ];
    case "tap":
      return OFF_ON;
    case "bmo":
      return [
        { value: "0", info: "Momentary" },
        { value: "1", info: "Toggle" },
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
    // a number field is never empty: it shows the default, and the user types
    // a value over it (an enum or a colour can be left to its default)
    return schema.type === "integer" || schema.type === "number"
      ? { error: "Required" }
      : {};
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
  mode: "Mode",
  sensitivity: "Sensitivity",
  bmo: "Button mode",
  spring: "Spring to",
  fingers: "Fingers (one channel each)",
  grab: "Capture focus",
  col: "Colour",
  msg: "Output",
  out: "Output",
  cmd: "Command",
  ch: "Channel",
  num: "CC",
  chy: "Y Channel",
  numy: "Y CC",
  tap: "Tap to click",
};

// The field title; the number is a CC, a note, a mouse button or a gamepad
// axis or button, by what the zone sends.
export function optionLabel(key: string, zone?: Zone): string {
  if ((key === "num" || key === "numy") && typeof zone !== "undefined") {
    const sends = zoneSends(zone);
    if (sends === "pad") {
      return zone.kind === "button" ? "Button" : "Axis";
    }
    const name =
      sends === "note"
        ? "Note"
        : sends === "mouse"
          ? "Button"
          : sends === "nrpn" || sends === "nrpn14"
            ? "NRPN"
            : "CC";
    // an xy pad has the number and the channel of x and of y
    return key === "numy" ? `Y ${name}` : xyMidi(zone) ? `X ${name}` : name;
  }
  if (key === "ch" && typeof zone !== "undefined" && xyMidi(zone)) {
    return "X Channel";
  }
  return optionLabels[key] ?? key;
}

// An xy pad that sends MIDI: x and y have a channel and a number each.
function xyMidi(zone: Zone): boolean {
  return (
    zoneRead(zone) === "point" &&
    zoneSends(zone) !== "mouse" &&
    zoneSends(zone) !== "pad"
  );
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
    // a zone with no name can't collide
    if (zone.name === "" || !used.has(zone.name)) {
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

// The names of the zones of the block at `index` among a Setup's action
// scripts, as the editor shows them (zoneLabels), with `zones` standing for
// that block's own zones. Without a name of its own a zone is the type and its
// number among the zones of that type that have no name, in the whole Setup.
export function blockZoneLabels(
  scripts: string[],
  index: number,
  zones: Zone[],
  short = false,
): string[] {
  const before = zonesOf(scripts.slice(0, index));
  const after = zonesOf(scripts.slice(index + 1));
  return zoneLabels([...before, ...zones, ...after], short).slice(
    before.length,
    before.length + zones.length,
  );
}
