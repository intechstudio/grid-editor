// Zone options as the zona.lua library reads them (RFC 4, 6.2). Blocks write
// only options that differ from these defaults, so they must equal Z.def,
// Z.kind and Z.tdef in libraries/zona/zona.lua; a test checks they match. A
// default may only change in a major library version.

export type ZoneKind = "fader" | "button" | "xy";

export type ZoneOptions = {
  dir: "v" | "h"; // axis direction: v (bottom = min) or h (left = min)
  res: number; // 2^res steps inside min-max, 7 to 14; min/max default to 0-127 (res 7) or 0-16383
  grab: "focus" | "live";
  mode: "abs" | "rel" | "glide";
  speed: number; // rel: drag factor; glide: 1 = full range in 50 ticks
  ease: number; // glide: share of the remaining distance added per tick
  bmo: number; // gate: 0 momentary, 1 toggle, n = n+1 steps (button mode)
  group: number; // gate: radio group 1-8, 0 none
  led: 0 | 1; // the kind's painter: fader fill, button state, xy crosshair
  ch: number; // MIDI channel 0-15, -1 auto (module row and page)
  num: number; // CC or note number 0-127, -1 auto (module column and slot); xy: y on num+1
  rx: 0 | 1; // 1: host MIDI on the zone's identity sets its value
};

// What a zone sends: per kind (zoneMsgValues), the default from Z.kind.
export type ZoneMsg = "note" | "cc" | "pb" | "none";

export const zoneDefaults: ZoneOptions = {
  dir: "v",
  res: 7,
  grab: "focus",
  mode: "abs",
  speed: 1,
  ease: 0,
  bmo: 0,
  group: 0,
  led: 1,
  ch: -1,
  num: -1,
  rx: 0,
};

// Z.kind: each kind's reader and painter (not an option) and its msg.
export const zoneKinds: Record<
  ZoneKind,
  { read: "axis" | "gate" | "point"; msg: ZoneMsg }
> = {
  fader: { read: "axis", msg: "cc" },
  button: { read: "gate", msg: "note" },
  xy: { read: "point", msg: "cc" },
};

export const zoneMsgValues: Record<ZoneKind, readonly ZoneMsg[]> = {
  fader: ["cc", "pb", "none"],
  button: ["note", "cc", "none"],
  xy: ["cc", "none"],
};

export const zoneKindList = Object.keys(zoneKinds) as ZoneKind[];

// Z.tdef: Touch Tick settings (Z.tick).
export type ZoneTickOptions = {
  ms: number; // timer interval: Z.tick re-arms the one-shot timer with it
};

export const zoneTickDefaults: ZoneTickOptions = {
  ms: 20,
};

export type ZoneOptionValue = string | number;

// A zone opening line (zone-parse.ts). `opt` holds the options the line sets,
// `unknown` the ones this editor doesn't know, as raw `key=value` text.
export type Zone = {
  name: string;
  kind: ZoneKind;
  x: number; // cells, 0-based, y = 0 the top row
  y: number;
  w: number;
  h: number;
  opt: Record<string, ZoneOptionValue>;
  unknown?: string;
};

// Z.tick(self,{...}) on the touch Timer.
export type ZoneTick = {
  opt: Record<string, ZoneOptionValue>;
  unknown?: string;
};

// Option schema. Ranges are inclusive. Integers and numbers without a range
// are only checked for their type.
export type OptionSchema = { key: string } & (
  | { type: "enum"; values: readonly string[] }
  | { type: "integer" | "number"; min?: number; max?: number }
);

// Block face sections, in display order (RFC 6.2 UI rules).
export type ZoneSection =
  "geometry" | "midi" | "resolution" | "led" | "behaviour" | "capture";

export const zoneSections: ZoneSection[] = [
  "geometry",
  "midi",
  "resolution",
  "led",
  "behaviour",
  "capture",
];

export const zoneSectionsOpen: ZoneSection[] = [
  "geometry",
  "midi",
  "resolution",
  "led",
];

export type ZoneOptionSchema = OptionSchema & {
  kinds: readonly ZoneKind[]; // kinds whose face shows it
  section: ZoneSection;
};

const ALL_KINDS = zoneKindList;
const CONTINUOUS: ZoneKind[] = ["fader", "xy"];

// In the order options are written (zone-parse.ts).
export const zoneOptionSchema: ZoneOptionSchema[] = [
  {
    key: "dir",
    type: "enum",
    values: ["v", "h"],
    kinds: ["fader"],
    section: "geometry",
  },
  {
    key: "res",
    type: "integer",
    min: 7,
    max: 14,
    kinds: ALL_KINDS,
    section: "resolution",
  },
  // min/max have no default here: the library takes 0 and 127 or 16383 by res
  { key: "min", type: "integer", kinds: ALL_KINDS, section: "resolution" },
  { key: "max", type: "integer", kinds: ALL_KINDS, section: "resolution" },
  {
    key: "mode",
    type: "enum",
    values: ["abs", "rel", "glide"],
    kinds: CONTINUOUS,
    section: "behaviour",
  },
  {
    key: "speed",
    type: "number",
    min: 0.01,
    max: 10,
    kinds: CONTINUOUS,
    section: "behaviour",
  },
  {
    key: "ease",
    type: "number",
    min: 0,
    max: 1,
    kinds: CONTINUOUS,
    section: "behaviour",
  },
  {
    key: "bmo",
    type: "integer",
    min: 0,
    max: 127,
    kinds: ["button"],
    section: "behaviour",
  },
  {
    key: "group",
    type: "integer",
    min: 0,
    max: 8,
    kinds: ["button"],
    section: "behaviour",
  },
  {
    key: "grab",
    type: "enum",
    values: ["focus", "live"],
    kinds: ALL_KINDS,
    section: "capture",
  },
  {
    key: "led",
    type: "integer",
    min: 0,
    max: 1,
    kinds: ALL_KINDS,
    section: "led",
  },
  // every value any kind takes; zoneOptionSchemaFor narrows it per kind
  {
    key: "msg",
    type: "enum",
    values: ["note", "cc", "pb", "none"],
    kinds: ALL_KINDS,
    section: "midi",
  },
  {
    key: "ch",
    type: "integer",
    min: -1,
    max: 15,
    kinds: ALL_KINDS,
    section: "midi",
  },
  {
    key: "num",
    type: "integer",
    min: -1,
    max: 127,
    kinds: ALL_KINDS,
    section: "midi",
  },
  {
    key: "rx",
    type: "integer",
    min: 0,
    max: 1,
    kinds: ALL_KINDS,
    section: "midi",
  },
];

// The schema as a zone of this kind takes it: msg with the kind's values.
export function zoneOptionSchemaFor(kind: ZoneKind): ZoneOptionSchema[] {
  return zoneOptionSchema.map((e) =>
    e.key === "msg" ? { ...e, values: zoneMsgValues[kind] } : e,
  );
}

export const zoneTickSchema: OptionSchema[] = [
  { key: "ms", type: "integer", min: 5, max: 1000 },
];

// What a zone of this kind uses when the line leaves the option out: the
// kind preset over the defaults. undefined for min and max.
export function zoneOptionDefault(
  kind: ZoneKind,
  key: string,
): ZoneOptionValue | undefined {
  const preset: Record<string, ZoneOptionValue> = {
    ...zoneDefaults,
    ...zoneKinds[kind],
  };
  return preset[key];
}
