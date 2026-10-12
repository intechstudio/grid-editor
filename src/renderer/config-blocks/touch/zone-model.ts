// Zone options as the zona.lua library reads them (RFC 4, 6.2). Blocks write
// only options that differ from these defaults, so they must equal Z.def and
// Z.kind in libraries/zona/zona.lua; a test checks they match. A default may
// only change in a major library version.

export type ZoneKind = "fader" | "button" | "xy" | "knob";

export type ZoneOptions = {
  read: "axis" | "gate" | "point" | "angle";
  dir: "v" | "h"; // axis direction: v (bottom = min) or h (left = min)
  res: number; // 2^res steps inside min-max, 7 to 14; min/max default to 0-127 (res 7) or 0-16383
  grab: "focus" | "live";
  leave: 0 | 1; // 1: leaving a focus zone releases, re-entry ignored until next down
  mode: "abs" | "rel" | "glide";
};

export const zoneDefaults: ZoneOptions = {
  read: "axis",
  dir: "v",
  res: 7,
  grab: "focus",
  leave: 0,
  mode: "abs",
};

// Kinds are option presets over the defaults.
export const zoneKinds: Record<ZoneKind, Partial<ZoneOptions>> = {
  fader: { read: "axis" },
  button: { read: "gate", leave: 1 },
  xy: { read: "point" },
  knob: { read: "angle" },
};
