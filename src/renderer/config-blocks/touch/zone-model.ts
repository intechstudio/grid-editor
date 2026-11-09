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
  col?: string; // zone colour "red,green,blue"; without it the module's default colour
  ch: number; // MIDI channel 0-15, -1 auto (module row and page)
  num: number; // CC or note number 0-127, -1 auto (module column and slot); xy: y on num+1; mouse button: the button, 1 left by default; gamepad: axis 0-5 or button 0-31, -1 auto (Setup order)
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
export type ZoneCmd = "cc" | "cc14" | "note" | "pb" | "nrpn" | "nrpn14";

export const zoneDefaults: ZoneOptions = {
  dir: "v",
  grab: "focus",
  mode: "abs",
  sensitivity: 1,
  bmo: 0,
  group: 0,
  ch: -1,
  num: -1,
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
  fader: ["cc", "cc14", "pb", "nrpn", "nrpn14"],
  button: ["note", "cc", "cc14", "nrpn", "nrpn14"],
};

export const zoneKindList = Object.keys(zoneKinds) as ZoneKind[];

export type ZoneOptionValue = string | number;

// A zone line (zone-parse.ts). `opt` holds the options the line sets.
export type Zone = {
  name: string;
  kind: ZoneKind;
  x: number; // cells, 0-based, y = 0 the top row
  y: number;
  w: number;
  h: number;
  opt: Record<string, ZoneOptionValue>;
};

// Option schema. Ranges are inclusive. Integers and numbers without a range
// are only checked for their type.
export type OptionSchema = { key: string } &
  // `unavailable`: values the select lists but the zone can't take (dimmed)
  (
    | {
        type: "enum";
        values: readonly string[];
        unavailable?: readonly string[];
      }
    | { type: "integer" | "number"; min?: number; max?: number }
    | { type: "color" } // "red,green,blue", written as {red,green,blue}; -1 is auto
  );

// Block face sections, in display order (docs/zona-touch-zones.md, Block face).
export type ZoneSection =
  "geometry" | "led" | "output" | "behaviour" | "capture";

export const zoneSections: ZoneSection[] = [
  "geometry",
  "led",
  "output",
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
  {
    key: "bmo",
    type: "integer",
    min: 0,
    max: 127,
    reads: ["gate"],
    hide: MOUSE,
    section: "behaviour",
  },
  {
    key: "group",
    type: "integer",
    min: 0,
    max: 8,
    reads: ["gate"],
    hide: MOUSE,
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
    key: "fingers",
    type: "integer",
    min: 1,
    max: 5,
    reads: ["point"],
    hide: MOUSE_PAD,
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
    key: "mode",
    type: "enum",
    values: ["abs", "rel"],
    reads: CONTINUOUS,
    hide: MOUSE,
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
    key: "tap",
    type: "integer",
    min: 0,
    max: 1,
    reads: ["point"],
    hide: NOT_MOUSE,
    section: "behaviour",
  },
];

// The schema as a zone takes it: msg and cmd with the kind's values (an XY
// pad sends CCs only); num is a mouse zone's button, so only a button shows
// it with mouse.
export function zoneOptionSchemaFor(
  zone: Pick<Zone, "kind" | "opt">,
): ZoneOptionSchema[] {
  const { kind } = zone;
  const cmd = zone.opt.cmd ?? zoneKinds[kind].cmd;
  const nrpn = cmd === "nrpn" || cmd === "nrpn14";
  return zoneOptionSchema.map((e) =>
    e.key === "msg"
      ? { ...e, values: zoneMsgValues[kind] }
      : e.key === "cmd"
        ? {
            ...e,
            values:
              zoneRead(zone) === "point"
                ? ["cc", "cc14", "nrpn", "nrpn14"]
                : zoneCmdValues[kind],
          }
        : e.key === "num"
          ? {
              ...e,
              // an NRPN number is 14-bit
              ...(nrpn && e.type === "integer" ? { max: 16383 } : {}),
              ...(kind !== "button" ? { hide: MOUSE } : {}),
            }
          : e,
  );
}

// Whether a zone with this output shows (and the library uses) the option.
// Sensitivity also needs relative mode, except for the mouse: absolute mode
// takes the finger's position as it is, and a mouse zone has no Mode.
export function zoneOptionShown(
  schema: ZoneOptionSchema,
  msg: ZoneOptionValue | undefined,
  zone?: Pick<Zone, "kind" | "opt">,
): boolean {
  if (schema.hide?.includes(msg as ZoneMsg)) {
    return false;
  }
  return !(
    schema.key === "sensitivity" &&
    typeof zone !== "undefined" &&
    msg !== "mouse" &&
    (zone.opt.mode ?? zoneOptionDefault(zone.kind, "mode")) !== "rel"
  );
}

// What a zone of this kind uses when the line leaves the option out: the
// kind preset over the defaults.
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

// The value a zone has for an option: the one its line sets, or what the
// library uses when the line leaves it out. The default of a colour is the
// module's own colour ({-1,-1,-1}).
export function zoneOptionValue(
  zone: Zone,
  key: string,
): ZoneOptionValue | undefined {
  const set = zone.opt[key];
  if (typeof set !== "undefined") {
    return set;
  }
  const sends = zoneSends(zone);
  switch (key) {
    case "num":
      return sends === "mouse" ? 1 : -1;
    case "col":
      return "-1,-1,-1";
    default:
      return zoneOptionDefault(zone.kind, key);
  }
}

// The outputs a zone can have as one list, numbered: 0 CC, 1 CC 14-bit, 2 Note,
// 3 Pitch bend, 4 Mouse, 5 Gamepad, 6 NRPN, 7 NRPN with a 14-bit value. (The
// numbers are the earlier line form's; the chain form names them with .gms,
// .mo and .ga.) The face shows it as one select (msg and cmd together), in
// the order of zoneOutputOrder.
export const zoneOutputs: { msg: ZoneMsg; cmd?: ZoneCmd }[] = [
  { msg: "midi", cmd: "cc" },
  { msg: "midi", cmd: "cc14" },
  { msg: "midi", cmd: "note" },
  { msg: "midi", cmd: "pb" },
  { msg: "mouse" },
  { msg: "pad" },
  { msg: "midi", cmd: "nrpn" },
  { msg: "midi", cmd: "nrpn14" },
];

// The number of the zone's output, -1 when its msg and command aren't one.
export function zoneOutputCode(zone: Zone): number {
  const msg = zoneOptionValue(zone, "msg");
  const cmd = zoneOptionValue(zone, "cmd");
  return zoneOutputs.findIndex((e) =>
    msg === "midi" ? e.msg === msg && e.cmd === cmd : e.msg === msg,
  );
}

// The order the Output select lists the outputs in: the MIDI ones, then the
// mouse and the gamepad.
export const zoneOutputOrder = [0, 1, 2, 3, 6, 7, 4, 5];

// What the Type select calls each type, and the short form the overlay uses.
export const zoneTypeTitles: Record<string, string> = {
  v: "Vertical Fader",
  h: "Horizontal Fader",
  xy: "XY Pad",
  button: "Button",
};
const zoneTypeShort: Record<string, string> = {
  v: "v",
  h: "h",
  xy: "xy",
  button: "b",
};

// The type of a zone: v, h, xy or button.
export function zoneTypeOf(zone: Pick<Zone, "kind" | "opt">): string {
  if (zone.kind === "button") {
    return "button";
  }
  return zone.opt.dir === "h" || zone.opt.dir === "xy" ? zone.opt.dir : "v";
}

// The names of the zones of a Setup, in order, as the editor shows them: the
// zone's own name, or for a zone without one the type and its number among
// the zones of that type that have no name ("XY Pad 2", or "xy2" when
// short). A zone with no name has none in the line.
export function zoneLabels(zones: Zone[], short = false): string[] {
  const count: Record<string, number> = {};
  return zones.map((zone) => {
    if (zone.name !== "") {
      return zone.name;
    }
    const type = zoneTypeOf(zone);
    count[type] = (count[type] ?? 0) + 1;
    return short
      ? `${zoneTypeShort[type]}${count[type]}`
      : `${zoneTypeTitles[type]} ${count[type]}`;
  });
}
