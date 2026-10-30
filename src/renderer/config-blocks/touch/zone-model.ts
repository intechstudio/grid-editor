// Zone options as the zona.lua library reads them (docs/zona-touch-zones.md, Options). Blocks write
// only options that differ from these defaults, so they must equal Z.def and
// Z.kind in content/libraries/zona.lua; a test checks they match. A default
// may only change in a major library version.

// An XY pad is a fader with dir "xy".
export type ZoneKind = "fader" | "button";

// What the library reads from a zone: one value (axis), a gate or a point
// (x and y). Set by the kind, and by dir on a fader.
export type ZoneRead = "axis" | "gate" | "point";

export type ZoneOptions = {
  dir: "v" | "h" | "xy"; // v (bottom = min) or h (left = min) axis, or an XY pad
  grab: "focus" | "live";
  mode: "abs" | "rel";
  sensitivity: number; // rel: drag factor; mouse: pointer sensitivity
  bmo: number; // gate: 0 momentary, 1 toggle, n = n+1 steps (button mode)
  group: number; // gate: radio group 1-8, 0 none
  col?: string; // zone colour "red,green,blue,alpha"; without it the module's default colour
  ch: number; // MIDI channel 0-15, -1 auto (module row and page)
  num: number; // CC or note number 0-127, -1 auto (module column and slot); xy: y on num+1; mouse button: the button, 1 left by default; gamepad: axis 0-5 or button 0-31, -1 auto (Setup order)
  rx: 0 | 1; // 1: host MIDI on the zone's identity sets its value
  spring: number; // fader, xy: -1 off, or 0-100: the % of the range the value returns to on release (50 is the centre)
  fingers: number; // xy pad: contacts it takes at once, 1-5; finger k on channel ch+k-1
  tap: 0 | 1; // mouse xy pad: 1 a short touch that barely moves clicks left
};

// What a zone sends: per kind (zoneMsgValues), the default from Z.kind.
// "midi" sends the zone's MIDI command (cmd); "mouse" is the wheel (fader),
// a button or the pointer (xy); "pad" is a gamepad axis (fader), button or
// two axes (xy).
export type ZoneMsg = "midi" | "mouse" | "pad";

// The MIDI command of a "midi" zone: per kind (zoneCmdValues), the default
// from Z.kind.
export type ZoneCmd = "cc" | "cc14" | "note" | "pb";

export const zoneDefaults: ZoneOptions = {
  dir: "v",
  grab: "focus",
  mode: "abs",
  sensitivity: 1,
  bmo: 0,
  group: 0,
  ch: -1,
  num: -1,
  rx: 0,
  spring: -1,
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
};

// What the library reads from a zone of this kind and direction.
export function zoneRead(zone: {
  kind: ZoneKind;
  opt: Record<string, ZoneOptionValue>;
}): ZoneRead {
  return zone.kind === "fader" && zone.opt.dir === "xy"
    ? "point"
    : zoneKinds[zone.kind].read;
}

export const zoneMsgValues: Record<ZoneKind, readonly ZoneMsg[]> = {
  fader: ["midi", "mouse", "pad"],
  button: ["midi", "mouse", "pad"],
};

export const zoneCmdValues: Record<ZoneKind, readonly ZoneCmd[]> = {
  fader: ["cc", "cc14", "pb"],
  button: ["note", "cc", "cc14"],
};

export const zoneKindList = Object.keys(zoneKinds) as ZoneKind[];

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

// Option schema. Ranges are inclusive. Integers and numbers without a range
// are only checked for their type.
export type OptionSchema = { key: string } & (
  | { type: "enum"; values: readonly string[] }
  | { type: "integer" | "number"; min?: number; max?: number }
  | { type: "color" } // "red,green,blue,alpha", written as {red,green,blue,alpha}; -1 is auto
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

export type ZoneOptionSchema = OptionSchema & {
  reads: readonly ZoneRead[]; // readers whose face shows it
  hide?: readonly ZoneMsg[]; // outputs whose face hides it; absent: none
  section: ZoneSection;
};

const ALL_READS: ZoneRead[] = ["axis", "gate", "point"];
const CONTINUOUS: ZoneRead[] = ["axis", "point"];
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
    values: ["v", "h", "xy"],
    reads: CONTINUOUS,
    section: "geometry",
  },
  // min/max have no default here: the library takes 0 and 127, or 16383 for cc14 and pb
  {
    key: "min",
    type: "integer",
    reads: ALL_READS,
    hide: MOUSE_PAD,
    section: "resolution",
  },
  {
    key: "max",
    type: "integer",
    reads: ALL_READS,
    hide: MOUSE_PAD,
    section: "resolution",
  },
  {
    key: "mode",
    type: "enum",
    values: ["abs", "rel"],
    reads: CONTINUOUS,
    hide: MOUSE,
    section: "behaviour",
  },
  {
    key: "sensitivity",
    type: "number",
    min: 0.01,
    max: 10,
    reads: CONTINUOUS,
    section: "behaviour",
  },
  {
    key: "bmo",
    type: "integer",
    min: 0,
    max: 127,
    reads: ["gate"],
    section: "behaviour",
  },
  {
    key: "spring",
    type: "integer",
    min: -1,
    max: 100,
    reads: CONTINUOUS,
    hide: MOUSE,
    section: "behaviour",
  },
  {
    key: "group",
    type: "integer",
    min: 0,
    max: 8,
    reads: ["gate"],
    section: "behaviour",
  },
  {
    key: "fingers",
    type: "integer",
    min: 1,
    max: 5,
    reads: ["point"],
    hide: MOUSE_PAD,
    section: "capture",
  },
  {
    key: "grab",
    type: "enum",
    values: ["focus", "live"],
    reads: ALL_READS,
    section: "capture",
  },
  { key: "col", type: "color", reads: ALL_READS, section: "led" },
  // every value any kind takes; zoneOptionSchemaFor narrows it per kind
  {
    key: "msg",
    type: "enum",
    values: ["midi", "mouse", "pad"],
    reads: ALL_READS,
    section: "output",
  },
  // every value any kind takes; zoneOptionSchemaFor narrows it per kind
  {
    key: "cmd",
    type: "enum",
    values: ["cc", "cc14", "note", "pb"],
    reads: ALL_READS,
    hide: MOUSE_PAD,
    section: "output",
  },
  {
    key: "ch",
    type: "integer",
    min: -1,
    max: 15,
    reads: ALL_READS,
    hide: MOUSE_PAD,
    section: "output",
  },
  {
    key: "num",
    type: "integer",
    min: -1,
    max: 127,
    reads: ALL_READS,
    section: "output",
  },
  {
    key: "rx",
    type: "integer",
    min: 0,
    max: 1,
    reads: ALL_READS,
    hide: MOUSE_PAD,
    section: "output",
  },
  {
    key: "tap",
    type: "integer",
    min: 0,
    max: 1,
    reads: ["point"],
    hide: NOT_MOUSE,
    section: "output",
  },
];

// The schema as a zone takes it: msg and cmd with the kind's values (an XY
// pad sends CCs only); num is a mouse zone's button, so only a button shows
// it with mouse.
export function zoneOptionSchemaFor(
  zone: Pick<Zone, "kind" | "opt">,
): ZoneOptionSchema[] {
  const { kind } = zone;
  return zoneOptionSchema.map((e) =>
    e.key === "msg"
      ? { ...e, values: zoneMsgValues[kind] }
      : e.key === "cmd"
        ? {
            ...e,
            values:
              zoneRead(zone) === "point" ? ["cc", "cc14"] : zoneCmdValues[kind],
          }
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
