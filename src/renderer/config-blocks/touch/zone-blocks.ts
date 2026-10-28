// What the Touch blocks need besides the model: block shorts, the script a new
// zone block starts with, the untoggled header text, and the face's fields
// from the option schema (docs/zona-touch-zones.md, Block face).

import {
  type OptionSchema,
  type Zone,
  type ZoneKind,
  type ZoneOptionSchema,
  type ZoneOptionValue,
  type ZoneSection,
  zoneOptionDefault,
  zoneOptionSchemaFor,
  zoneOptionShown,
  zoneSections,
  zoneSectionsOpen,
  zoneSends,
} from "./zone-model";
import { parseZone, zoneToLua } from "./zone-parse";
import { type ZoneMidi, PAD_AXIS_NAMES } from "./zone-autos";
import { midiCC } from "../_midi.js";
import { MusicalNotes } from "../../main/panels/MidiMonitor/midi-types";

export const zoneBlockShort: Record<ZoneKind, string> = {
  fader: "zfd",
  button: "zbt",
  xy: "zxy",
};

// Default names are the prefix plus the next free number: f1, b1, p1.
const NAME_PREFIX: Record<ZoneKind, string> = {
  fader: "f",
  button: "b",
  xy: "p",
};

// Cells a new zone gets. Placing it on the first free spot is a later step.
const DEFAULT_CELLS: Record<ZoneKind, [number, number]> = {
  fader: [1, 9],
  button: [2, 2],
  xy: [4, 4],
};

// The first name prefix+n that no zone in these scripts uses.
export function defaultZoneName(kind: ZoneKind, scripts: string[]): string {
  const used = new Set(
    scripts.map((e) => parseZone(e)?.name).filter((e) => e !== undefined),
  );
  let n = 1;
  while (used.has(`${NAME_PREFIX[kind]}${n}`)) {
    n++;
  }
  return `${NAME_PREFIX[kind]}${n}`;
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
    opt: {},
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
  open: boolean; // open by default
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
      open: zoneSectionsOpen.includes(section),
      options: zoneOptionSchemaFor(zone.kind).filter(
        (e) =>
          e.section === section &&
          e.kinds.includes(zone.kind) &&
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
  return optionText(zoneOptionDefault(kind, key));
}

export type EnumOption = { title: string; value: string };

// Select titles of enum values.
const enumValueLabels: Record<string, Record<string, string>> = {
  dir: { v: "Vertical", h: "Horizontal" },
  msg: { midi: "MIDI" },
  cmd: { cc: "CC", note: "Note", pb: "Pitch bend" },
  mode: { abs: "Absolute", rel: "Relative", glide: "Glide" },
  grab: { focus: "Focus", live: "Live" },
};

// What a mouse or gamepad zone of each kind is, as its Output title.
const zoneKindTitles: Record<string, Record<ZoneKind, string>> = {
  mouse: { fader: "Mouse wheel", button: "Mouse button", xy: "Mouse" },
  pad: { fader: "Gamepad axis", button: "Gamepad button", xy: "Gamepad" },
};

// Select entries of an enum option: the schema's values; the zone's default
// is selected when the line leaves the option out. A value the schema doesn't
// know (a newer editor's, a hand-written line) is listed too, so the select
// shows what the line says and nothing is rewritten until the user picks
// something. The kind names its mouse and gamepad outputs.
export function enumOptions(
  schema: OptionSchema,
  value: string,
  kind?: ZoneKind,
): EnumOption[] {
  if (schema.type !== "enum") {
    return [];
  }
  const labels: Record<string, string> = { ...enumValueLabels[schema.key] };
  if (schema.key === "msg" && typeof kind !== "undefined") {
    for (const [msg, titles] of Object.entries(zoneKindTitles)) {
      labels[msg] = titles[kind];
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
    case "res":
      return Array.from({ length: 8 }, (_, i) => ({
        value: String(i + 7),
        info: `0–${2 ** (i + 7) - 1}`,
      }));
    case "min":
      return [{ value: "0", info: "Lowest" }];
    case "max":
      return [
        { value: "127", info: "7 bit" },
        { value: "16383", info: "14 bit" },
      ];
    case "rx":
    case "led":
    case "spring":
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
    return { value: trimmed.replace(/^#/, "").toLowerCase() };
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? { value } : { error: "Enter a number" };
}

// A zone or tick with one option set from field text, or an error when
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

export const zoneSectionLabels: Record<ZoneSection, string> = {
  geometry: "Geometry",
  output: "Output",
  resolution: "Resolution",
  led: "LED",
  behaviour: "Behaviour",
  capture: "Capture",
};

// Field titles of the options and tick settings.
export const optionLabels: Record<string, string> = {
  dir: "Direction",
  res: "Resolution bits",
  min: "Min",
  max: "Max",
  mode: "Mode",
  speed: "Speed",
  ease: "Ease",
  bmo: "Button mode",
  spring: "Spring to centre",
  fingers: "Fingers (one channel each)",
  group: "Radio group",
  grab: "Capture",
  led: "LED feedback",
  col: "Colour",
  msg: "Output",
  cmd: "Command",
  ch: "Channel",
  num: "CC",
  rx: "Receive MIDI",
  ms: "Interval (ms)",
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
  const zone = parseZone(script);
  if (zone === null) {
    return script;
  }
  const used = others.map((e) => parseZone(e)?.name);
  if (!used.includes(zone.name)) {
    return script;
  }
  return zoneToLua({ ...zone, name: defaultZoneName(zone.kind, others) });
}
