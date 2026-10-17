// Zone validators (RFC 6.2). Per zone: what the block face shows inline next
// to a field. Per surface: the issues of a whole touch Setup, each naming a
// zone or, without one, the surface.

import { Validator } from "../validators";
import {
  firmwareNameProblem,
  identifierProblem,
  parseLibraryScript,
} from "../../libraries/library-script";
import {
  type OptionSchema,
  type Zone,
  type ZoneOptionValue,
  type ZoneTick,
  zoneKinds,
  zoneOptionDefault,
  zoneOptionSchemaFor,
  zoneTickSchema,
} from "./zone-model";
import { parseZone, ZONA_GLOBAL, ZONE_START_SCRIPT } from "./zone-parse";

const GRID_SIZE = 9;
const ZONA_FILE = "zona";

// One rejected field: a geometry key ("x"), "name" or an option key.
export type ZoneProblem = { key: string; message: string };

export type ZoneIssue = {
  zone?: string; // undefined: the surface
  level: "error" | "warning";
  message: string;
};

// The touch Setup's top-level actions, in order.
export type SurfaceContext = { actions: { script: string }[] };

// The name sits in a string that compressScript would rewrite if it were a
// firmware human name (RFC 2.1).
export function zoneNameProblem(name: string): string | undefined {
  if (name.length === 0) {
    return "Enter a zone name";
  }
  return identifierProblem(name) ?? firmwareNameProblem(name);
}

function isInteger(value: ZoneOptionValue): boolean {
  return typeof value === "number" && Number.isInteger(value);
}

// Why an option value is rejected, or undefined when it is valid.
export function optionProblem(
  schema: OptionSchema,
  value: ZoneOptionValue,
): string | undefined {
  if (schema.type === "enum") {
    return typeof value === "string" && schema.values.includes(value)
      ? undefined
      : `Use one of ${schema.values.join(", ")}`;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Enter a number";
  }
  if (schema.type === "integer" && !isInteger(value)) {
    return "Enter a whole number";
  }
  const min = schema.min ?? -Infinity;
  const max = schema.max ?? Infinity;
  if (!new Validator(value).InRange(min, max).Result()) {
    return `Use ${schema.min ?? "any"} to ${schema.max ?? "any"}`;
  }
  return undefined;
}

function optionProblems(
  opt: Record<string, ZoneOptionValue>,
  schema: OptionSchema[],
): ZoneProblem[] {
  const problems: ZoneProblem[] = [];
  for (const entry of schema) {
    const value = opt[entry.key];
    if (typeof value === "undefined") {
      continue;
    }
    const message = optionProblem(entry, value);
    if (typeof message !== "undefined") {
      problems.push({ key: entry.key, message });
    }
  }
  return problems;
}

function geometryProblems(zone: Zone): ZoneProblem[] {
  const problems: ZoneProblem[] = [];
  for (const key of ["x", "y", "w", "h"] as const) {
    if (!isInteger(zone[key])) {
      problems.push({ key, message: "Enter a whole number of cells" });
    }
  }
  if (problems.length > 0) {
    return problems;
  }
  for (const key of ["w", "h"] as const) {
    if (zone[key] < 1) {
      problems.push({ key, message: "At least 1 cell" });
    }
  }
  for (const [at, size] of [
    ["x", "w"],
    ["y", "h"],
  ] as const) {
    if (zone[at] < 0 || zone[at] + Math.max(zone[size], 1) > GRID_SIZE) {
      problems.push({ key: at, message: "Keep the zone inside the 9×9 grid" });
    }
  }
  return problems;
}

function option(zone: Zone, key: string) {
  return zone.opt[key] ?? zoneOptionDefault(zone.kind, key);
}

// res as the library uses it: pitch bend is always 14-bit.
function resOf(zone: Zone): number {
  return option(zone, "msg") === "pb" ? 14 : Number(option(zone, "res"));
}

// min and max as the library uses them: 0 and 127, or 16383 above res 7.
// A zone that sends MIDI keeps them in 0-16383 (the wire range); with
// msg="none" any range goes (values for gamepad or mouse in the body).
function rangeProblems(zone: Zone): ZoneProblem[] {
  const min = zone.opt.min ?? 0;
  const max = zone.opt.max ?? (resOf(zone) > 7 ? 16383 : 127);
  if (typeof min !== "number" || typeof max !== "number") {
    return [];
  }
  if (option(zone, "msg") !== "none") {
    const outside = (["min", "max"] as const).filter(
      (key) =>
        typeof zone.opt[key] !== "undefined" &&
        (Number(zone.opt[key]) < 0 || Number(zone.opt[key]) > 16383),
    );
    if (outside.length > 0) {
      return outside.map((key) => ({
        key,
        message: "Use 0 to 16383 when the zone sends MIDI",
      }));
    }
  }
  if (min < max) {
    return [];
  }
  return [
    {
      key: typeof zone.opt.max !== "undefined" ? "max" : "min",
      message: `Max (${max}) must be above min (${min})`,
    },
  ];
}

// An explicit num keeps every number the zone sends in 0-127: a 14-bit CC
// sends its LSB on num+32 (num 0-31), an xy its y on num+1.
function numProblems(zone: Zone): ZoneProblem[] {
  const num = Number(option(zone, "num"));
  const msg = option(zone, "msg");
  if (num < 0 || msg === "pb" || msg === "none") {
    return [];
  }
  const xy = zoneKinds[zone.kind].read === "point";
  const wide = msg === "cc" && resOf(zone) > 7;
  const max = (wide ? 31 : 127) - (xy ? 1 : 0);
  if (num <= max) {
    return [];
  }
  const why = [
    wide ? "a 14-bit CC sends its LSB on num+32" : "",
    xy ? "y goes on num+1" : "",
  ]
    .filter((e) => e !== "")
    .join(", ");
  return [{ key: "num", message: `Use -1 (auto) or 0 to ${max}: ${why}` }];
}

export function zoneProblems(zone: Zone): ZoneProblem[] {
  const problems: ZoneProblem[] = [];
  const name = zoneNameProblem(zone.name);
  if (typeof name !== "undefined") {
    problems.push({ key: "name", message: name });
  }
  problems.push(...geometryProblems(zone));
  const options = optionProblems(zone.opt, zoneOptionSchemaFor(zone.kind));
  problems.push(...options);
  const bad = (keys: string[]) => options.some((e) => keys.includes(e.key));
  if (!bad(["res", "min", "max", "msg"])) {
    problems.push(...rangeProblems(zone));
  }
  if (!bad(["res", "num", "msg"])) {
    problems.push(...numProblems(zone));
  }
  return problems;
}

export function zoneTickProblems(tick: ZoneTick): ZoneProblem[] {
  return optionProblems(tick.opt, zoneTickSchema);
}

// Which file the global Z is bound to by the Library blocks before `end`.
// v1 limits: a Library line with an invalid row doesn't parse, so its
// bindings count as missing; a Library block between zones that rebinds Z
// isn't looked at.
function boundFile(actions: { script: string }[], end: number) {
  let file: string | undefined;
  for (const { script } of actions.slice(0, end)) {
    for (const row of parseLibraryScript(script) ?? []) {
      if (row.global === ZONA_GLOBAL) {
        file = row.file;
      }
    }
  }
  return file;
}

function orderIssues(context: SurfaceContext): ZoneIssue[] {
  const { actions } = context;
  const first = actions.findIndex((e) => parseZone(e.script) !== null);
  if (first === -1) {
    return [];
  }
  const issues: ZoneIssue[] = [];
  if (boundFile(actions, first) !== ZONA_FILE) {
    issues.push({
      level: "warning",
      message: `Add a Library block that binds ${ZONA_GLOBAL} to ${ZONA_FILE} before the first zone`,
    });
  }
  const isStart = (e: { script: string }) =>
    e.script.trim() === ZONE_START_SCRIPT;
  if (!actions.some(isStart)) {
    issues.push({
      level: "warning",
      message: "Add Touch Start as the last block: zones stay inactive",
    });
  } else if (!isStart(actions[actions.length - 1])) {
    issues.push({
      level: "warning",
      message: "Move Touch Start to the end of Setup",
    });
  }
  return issues;
}

// Issues of a whole touch Setup: per zone problems, duplicate names, block
// order. `zones` are the parsed zone blocks of `context.actions`.
export function validateSurface(
  zones: Zone[],
  context: SurfaceContext,
): ZoneIssue[] {
  const issues: ZoneIssue[] = [];
  for (const zone of zones) {
    for (const { message } of zoneProblems(zone)) {
      issues.push({ zone: zone.name, level: "error", message });
    }
  }
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const { name } of zones) {
    if (seen.has(name) && !reported.has(name)) {
      reported.add(name);
      issues.push({
        zone: name,
        level: "error",
        message: `Another zone is also named "${name}"`,
      });
    }
    seen.add(name);
  }
  return [...issues, ...orderIssues(context)];
}

// The surface issues of a touch Setup given as its action scripts.
export function surfaceIssues(scripts: string[]): ZoneIssue[] {
  const zones = scripts
    .map((e) => parseZone(e))
    .filter((e): e is Zone => e !== null);
  return validateSurface(zones, {
    actions: scripts.map((script) => ({ script })),
  });
}

// What stops the touch Setup from being sent: a zone name used twice, since
// zona.lua 0.7.1 would drop the zones before the second one. Other zone
// problems (an unknown painter from a newer library, a value out of range)
// show on the face but don't block a Setup that came from the module or a
// profile; the face keeps the user's own invalid edits from being sent.
export function zoneSendProblem(
  script: string,
  eventScripts: string[],
): string | undefined {
  const zone = parseZone(script);
  if (zone === null) {
    return undefined;
  }
  const uses = eventScripts.filter((e) => parseZone(e)?.name === zone.name);
  return uses.length > 1
    ? `Another zone is also named "${zone.name}"`
    : undefined;
}
