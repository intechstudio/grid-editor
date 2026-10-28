// Zone options as the zona.lua library reads them (docs/zona-touch-zones.md, Options). Blocks write
// only options that differ from these defaults, so they must equal Z.def,
// Z.kind and Z.tdef in content/libraries/zona.lua; a test checks they match. A
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
  col?: string; // zone colour "rrggbb"; without it the module's default colour
  ch: number; // MIDI channel 0-15, -1 auto (module row and page)
  num: number; // CC or note number 0-127, -1 auto (module column and slot); xy: y on num+1; mouse button: the button, 1 left by default; gamepad: axis 0-5 or button 0-31, -1 auto (Setup order)
  rx: 0 | 1; // 1: host MIDI on the zone's identity sets its value
  spring: 0 | 1; // fader, xy: 1 returns to the centre on release (eased by ease)
  fingers: number; // xy: contacts it takes at once, 1-5; finger k on channel ch+k-1
  tap: 0 | 1; // mouse xy: 1 a short touch that barely moves clicks left
};

// What a zone sends: per kind (zoneMsgValues), the default from Z.kind.
// "midi" sends the zone's MIDI command (cmd); "mouse" is the wheel (fader),
// a button or the pointer (xy); "pad" is a gamepad axis (fader), button or
// two axes (xy).
export type ZoneMsg = "midi" | "mouse" | "pad";

// The MIDI command of a "midi" zone: per kind (zoneCmdValues), the default
// from Z.kind.
export type ZoneCmd = "cc" | "note" | "pb";

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
  spring: 0,
  fingers: 1,
  tap: 1,
};

// Z.kind: each kind's reader and painter (not an option), msg and cmd.
export const zoneKinds: Record<
  ZoneKind,
  { read: "axis" | "gate" | "point"; msg: ZoneMsg; cmd: ZoneCmd }
> = {
  fader: { read: "axis", msg: "midi", cmd: "cc" },
  button: { read: "gate", msg: "midi", cmd: "note" },
  xy: { read: "point", msg: "midi", cmd: "cc" },
};

export const zoneMsgValues: Record<ZoneKind, readonly ZoneMsg[]> = {
  fader: ["midi", "mouse", "pad"],
  button: ["midi", "mouse", "pad"],
  xy: ["midi", "mouse", "pad"],
};

export const zoneCmdValues: Record<ZoneKind, readonly ZoneCmd[]> = {
  fader: ["cc", "pb"],
  button: ["note", "cc"],
  xy: ["cc"],
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

// A zone line (zone-parse.ts). `opt` holds the options the line sets,
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
  | { type: "color" } // "rrggbb" hex; the editor writes lower case
);

// Block face sections, in display order (docs/zona-touch-zones.md, Block face).
export type ZoneSection =
  "geometry" | "output" | "resolution" | "led" | "behaviour" | "capture";

export const zoneSections: ZoneSection[] = [
  "geometry",
  "output",
  "resolution",
  "led",
  "behaviour",
  "capture",
];

export const zoneSectionsOpen: ZoneSection[] = [
  "geometry",
  "output",
  "resolution",
  "led",
];

export type ZoneOptionSchema = OptionSchema & {
  kinds: readonly ZoneKind[]; // kinds whose face shows it
  hide?: readonly ZoneMsg[]; // outputs whose face hides it; absent: none
  section: ZoneSection;
};

const ALL_KINDS = zoneKindList;
const CONTINUOUS: ZoneKind[] = ["fader", "xy"];
// options a mouse zone doesn't use
const MOUSE: ZoneMsg[] = ["mouse"];
// options neither a mouse nor a gamepad zone uses
const MOUSE_PAD: ZoneMsg[] = ["mouse", "pad"];
// options only a mouse zone uses
const NOT_MOUSE: ZoneMsg[] = ["midi", "pad"];

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
    hide: MOUSE_PAD,
    section: "resolution",
  },
  // min/max have no default here: the library takes 0 and 127 or 16383 by res
  {
    key: "min",
    type: "integer",
    kinds: ALL_KINDS,
    hide: MOUSE_PAD,
    section: "resolution",
  },
  {
    key: "max",
    type: "integer",
    kinds: ALL_KINDS,
    hide: MOUSE_PAD,
    section: "resolution",
  },
  {
    key: "mode",
    type: "enum",
    values: ["abs", "rel", "glide"],
    kinds: CONTINUOUS,
    hide: MOUSE,
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
    hide: MOUSE,
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
    key: "spring",
    type: "integer",
    min: 0,
    max: 1,
    kinds: CONTINUOUS,
    hide: MOUSE,
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
    key: "fingers",
    type: "integer",
    min: 1,
    max: 5,
    kinds: ["xy"],
    hide: MOUSE_PAD,
    section: "capture",
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
  { key: "col", type: "color", kinds: ALL_KINDS, section: "led" },
  // every value any kind takes; zoneOptionSchemaFor narrows it per kind
  {
    key: "msg",
    type: "enum",
    values: ["midi", "mouse", "pad"],
    kinds: ALL_KINDS,
    section: "output",
  },
  // every value any kind takes; zoneOptionSchemaFor narrows it per kind
  {
    key: "cmd",
    type: "enum",
    values: ["cc", "note", "pb"],
    kinds: ALL_KINDS,
    hide: MOUSE_PAD,
    section: "output",
  },
  {
    key: "ch",
    type: "integer",
    min: -1,
    max: 15,
    kinds: ALL_KINDS,
    hide: MOUSE_PAD,
    section: "output",
  },
  {
    key: "num",
    type: "integer",
    min: -1,
    max: 127,
    kinds: ALL_KINDS,
    section: "output",
  },
  {
    key: "rx",
    type: "integer",
    min: 0,
    max: 1,
    kinds: ALL_KINDS,
    hide: MOUSE_PAD,
    section: "output",
  },
  {
    key: "tap",
    type: "integer",
    min: 0,
    max: 1,
    kinds: ["xy"],
    hide: NOT_MOUSE,
    section: "output",
  },
];

// The schema as a zone of this kind takes it: msg and cmd with the kind's
// values; num is a mouse zone's button, so only a button shows it with mouse.
export function zoneOptionSchemaFor(kind: ZoneKind): ZoneOptionSchema[] {
  return zoneOptionSchema.map((e) =>
    e.key === "msg"
      ? { ...e, values: zoneMsgValues[kind] }
      : e.key === "cmd"
        ? { ...e, values: zoneCmdValues[kind] }
        : e.key === "num" && kind !== "button"
          ? { ...e, hide: MOUSE }
          : e,
  );
}

// Whether a zone with this output shows (and the library uses) the option.
export function zoneOptionShown(
  schema: ZoneOptionSchema,
  msg: ZoneOptionValue | undefined,
): boolean {
  return !schema.hide?.includes(msg as ZoneMsg);
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

// What the zone sends, as Z.zone reads it: the MIDI command (cc, note, pb)
// of a "midi" zone, otherwise its msg ("mouse", "pad").
export function zoneSends(zone: Zone): ZoneOptionValue | undefined {
  const option = (key: string) =>
    zone.opt[key] ?? zoneOptionDefault(zone.kind, key);
  const msg = option("msg");
  return msg === "midi" ? option("cmd") : msg;
}
