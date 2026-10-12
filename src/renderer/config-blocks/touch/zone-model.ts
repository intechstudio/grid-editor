// Zone options as the zona.lua library reads them (RFC 4, 6.2). Blocks write
// only options that differ from these defaults, so they must equal Z.def,
// Z.kind and Z.gdef in libraries/zona/zona.lua; a test checks they match. A
// default may only change in a major library version.

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
