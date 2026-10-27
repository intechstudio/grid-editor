// What the Touch blocks need besides the model: block shorts, the script a new
// zone block starts with, the untoggled header text, and the face's fields
// from the option schema (RFC 6.2).

import {
  type OptionSchema,
  type Zone,
  type ZoneKind,
  type ZoneOptionSchema,
  type ZoneOptionValue,
  type ZoneSection,
  zoneOptionDefault,
  zoneOptionSchemaFor,
  zoneSections,
  zoneSectionsOpen,
} from "./zone-model";
import { parseZone, zoneToLua } from "./zone-parse";

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
// "f1 · 0,0 1×9 · CC 32 ch 1" (zoneMidiLabel).
export function zoneHeaderText(zone: Zone, midi?: string): string {
  const text = `${zone.name} · ${zone.x},${zone.y} ${zone.w}×${zone.h}`;
  return typeof midi === "undefined" ? text : `${text} · ${midi}`;
}

export type ZoneFaceSection = {
  section: ZoneSection;
  open: boolean; // open by default
  options: ZoneOptionSchema[];
};

// The face's option sections for a kind, in display order. Geometry is
// listed even without options: the face puts x, y, w, h there.
export function zoneFaceSections(kind: ZoneKind): ZoneFaceSection[] {
  return zoneSections
    .map((section) => ({
      section,
      open: zoneSectionsOpen.includes(section),
      options: zoneOptionSchemaFor(kind).filter(
        (e) => e.section === section && e.kinds.includes(kind),
      ),
    }))
    .filter((e) => e.section === "geometry" || e.options.length > 0);
}

// Field text of an option: its value, or empty when the line leaves it out.
export function optionText(value: ZoneOptionValue | undefined): string {
  return typeof value === "undefined" ? "" : String(value);
}

// Shown in an empty field: what the zone uses without the option.
export function optionPlaceholder(kind: ZoneKind, key: string): string {
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

// Select entries of an enum option: the default first (value ""), then the
// schema's values. A value the schema doesn't know (a newer editor's painter,
// a hand-written line) is listed too, so the select shows what the line says
// and nothing is rewritten until the user picks something.
export function enumOptions(
  schema: OptionSchema,
  value: string,
  placeholder: string,
): EnumOption[] {
  if (schema.type !== "enum") {
    return [];
  }
  const options = [
    { title: `default (${placeholder})`, value: "" },
    ...schema.values.map((e) => ({ title: e, value: e })),
  ];
  if (value !== "" && !schema.values.includes(value)) {
    options.push({ title: `${value} (unknown)`, value });
  }
  return options;
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
  midi: "MIDI",
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
  spring: "Spring to centre (0 off, 1 on)",
  fingers: "Fingers (one channel each)",
  group: "Radio group",
  grab: "Capture",
  led: "LED feedback (0 off, 1 on)",
  col: "Colour",
  msg: "Message",
  ch: "Channel",
  num: "Number",
  rx: "Receive (0 off, 1 on)",
  ms: "Interval (ms)",
};

export function optionLabel(key: string): string {
  return optionLabels[key] ?? key;
}

// A zone line pasted, dropped or loaded next to these scripts: when its name
// is already used by a zone there, it gets the next free name of its kind.
// zona.lua treats a repeated pending name as a new Setup run, so a duplicate
// would drop the zones before it (RFC 6.2).
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
