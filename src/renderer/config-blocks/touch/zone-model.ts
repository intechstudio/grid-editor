// Zone options as the zona.lua library reads them (RFC 4, 6.2). Blocks write
// only options that differ from these defaults, so they must equal Z.def,
// Z.kind, Z.gdef and Z.tdef in libraries/zona/zona.lua; a test checks they
// match. A default may only change in a major library version.

export type ZoneKind = "fader" | "button" | "xy" | "knob";

export type ZoneOptions = {
  read: "axis" | "gate" | "point" | "angle";
  dir: "v" | "h"; // axis direction: v (bottom = min) or h (left = min)
  res: number; // 2^res steps inside min-max, 7 to 14; min/max default to 0-127 (res 7) or 0-16383
  grab: "focus" | "live";
  leave: 0 | 1; // 1: leaving a focus zone releases, re-entry ignored until next down
  mode: "abs" | "rel" | "glide";
  speed: number; // rel: drag factor; glide: 1 = full range in 50 ticks
  ease: number; // glide: share of the remaining distance added per tick
  contact: "new" | "move" | "grab"; // more contacts in one zone
  drag: "n" | "v" | "h"; // knob: read a straight drag instead of the angle
  bmo: number; // gate: 0 momentary, 1 toggle, n = n+1 steps (button mode)
  group: number; // gate: radio group 1-8, 0 none
  led: "fill" | "dot" | "comet" | "crosshair" | "target" | "arc" | "n";
  release: "keep" | "clear" | "fade"; // LEDs on release
  sens: ZoneSens;
  db: number; // raw overrides, -1 = from sens: deadband (raw units)
  sm: number; // smoothing, 0-1 share of the old position kept
  rt: number; // rate limit, ticks between runs of a source
};

export type ZoneSens = "l" | "n" | "h";

export type ZoneGroupOptions = {
  empty: 0 | 1; // 0 keeps one member on
};

export const zoneDefaults: ZoneOptions = {
  read: "axis",
  dir: "v",
  res: 7,
  grab: "focus",
  leave: 0,
  mode: "abs",
  speed: 1,
  ease: 0,
  contact: "new",
  drag: "n",
  bmo: 0,
  group: 0,
  led: "fill",
  release: "keep",
  sens: "n",
  db: -1,
  sm: -1,
  rt: -1,
};

// Z.sens: sensitivity presets as [db, sm, rt].
export const zoneSens: Record<ZoneSens, [number, number, number]> = {
  l: [4, 0.5, 1],
  n: [2, 0, 0],
  h: [0, 0, 0],
};

// Z.gdef: group settings (Z.group).
export const zoneGroupDefaults: ZoneGroupOptions = {
  empty: 1,
};

// Kinds are option presets over the defaults.
export const zoneKinds: Record<ZoneKind, Partial<ZoneOptions>> = {
  fader: { read: "axis" },
  button: { read: "gate", leave: 1 },
  xy: { read: "point", led: "crosshair" },
  knob: { read: "angle", led: "arc" },
};

export const zoneKindList = Object.keys(zoneKinds) as ZoneKind[];

// Z.tdef: Touch Tick settings (Z.tick).
export type ZoneTickOptions = {
  ms: number; // timer interval: Z.tick re-arms the one-shot timer with it
  led: number; // LED divider: repaint every n ticks
  win: number; // mapping window after a utility press, in ms
};

export const zoneTickDefaults: ZoneTickOptions = {
  ms: 20,
  led: 1,
  win: 300,
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

// Z.group(n,{...}): settings of radio group n.
export type ZoneGroup = {
  n: number;
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
  "geometry" | "resolution" | "led" | "behaviour" | "capture" | "sensitivity";

export const zoneSections: ZoneSection[] = [
  "geometry",
  "resolution",
  "led",
  "behaviour",
  "capture",
  "sensitivity",
];

export const zoneSectionsOpen: ZoneSection[] = [
  "geometry",
  "resolution",
  "led",
];

export type ZoneOptionSchema = OptionSchema & {
  kinds: readonly ZoneKind[]; // kinds whose face shows it
  section: ZoneSection;
};

const ALL_KINDS = zoneKindList;
const CONTINUOUS: ZoneKind[] = ["fader", "xy", "knob"];

// In the order options are written (zone-parse.ts). `read` comes from the
// kind, so no face shows it; a line that sets it still parses.
export const zoneOptionSchema: ZoneOptionSchema[] = [
  {
    key: "read",
    type: "enum",
    values: ["axis", "gate", "point", "angle"],
    kinds: [],
    section: "behaviour",
  },
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
    key: "drag",
    type: "enum",
    values: ["n", "v", "h"],
    kinds: ["knob"],
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
    key: "leave",
    type: "integer",
    min: 0,
    max: 1,
    kinds: ALL_KINDS,
    section: "capture",
  },
  {
    key: "contact",
    type: "enum",
    values: ["new", "move", "grab"],
    kinds: CONTINUOUS,
    section: "capture",
  },
  {
    key: "led",
    type: "enum",
    values: ["fill", "dot", "comet", "crosshair", "target", "arc", "n"],
    kinds: ALL_KINDS,
    section: "led",
  },
  {
    key: "release",
    type: "enum",
    values: ["keep", "clear", "fade"],
    kinds: ALL_KINDS,
    section: "led",
  },
  {
    key: "sens",
    type: "enum",
    values: ["l", "n", "h"],
    kinds: CONTINUOUS,
    section: "sensitivity",
  },
  // -1: from sens
  {
    key: "db",
    type: "integer",
    min: -1,
    max: 1023,
    kinds: CONTINUOUS,
    section: "sensitivity",
  },
  {
    key: "sm",
    type: "number",
    min: -1,
    max: 0.99,
    kinds: CONTINUOUS,
    section: "sensitivity",
  },
  {
    key: "rt",
    type: "integer",
    min: -1,
    max: 100,
    kinds: CONTINUOUS,
    section: "sensitivity",
  },
];

export const zoneGroupSchema: OptionSchema[] = [
  { key: "empty", type: "integer", min: 0, max: 1 },
];

export const zoneTickSchema: OptionSchema[] = [
  { key: "ms", type: "integer", min: 5, max: 1000 },
  { key: "led", type: "integer", min: 1, max: 50 },
  { key: "win", type: "integer", min: 0, max: 5000 },
];

// Radio groups are numbered 1 to 8, like the group option.
export const zoneGroupRange = { min: 1, max: 8 };

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
