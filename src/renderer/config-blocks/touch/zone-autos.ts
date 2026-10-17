// What blocks inside a zone body send and can read (RFC 4.1): the MIDI autos
// of the zone, mirroring au() in libraries/zona/zona.lua, and the zone getters
// offered as value suggestions.

import type { Zone, ZoneKind } from "./zone-model";
import { zoneKinds, zoneOptionDefault } from "./zone-model";
import { parseZone } from "./zone-parse";

type Placed = { script: string; information: { type: string } };

// The zone whose body holds the action at `index`, with every zone line of
// the event in order (the CC slots count the zones before it). null outside
// a zone body.
export function zoneContext(
  actions: Placed[],
  index: number,
): { zones: Zone[]; index: number } | null {
  let depth = 0;
  let open = -1;
  for (let i = Math.min(index, actions.length) - 1; i >= 0; i--) {
    const { type } = actions[i].information;
    if (type === "composite_close") {
      depth++;
    } else if (type === "composite_open") {
      if (depth === 0 && parseZone(actions[i].script) !== null) {
        open = i;
        break;
      }
      depth = Math.max(depth - 1, 0);
    }
  }
  if (open === -1) {
    return null;
  }
  const zones: Zone[] = [];
  let at = -1;
  actions.forEach((e, i) => {
    const zone = parseZone(e.script);
    if (zone !== null) {
      if (i === open) {
        at = zones.length;
      }
      zones.push(zone);
    }
  });
  return { zones, index: at };
}

function readerOf(zone: Zone): string {
  return zoneKinds[zone.kind].read;
}

export type ZonePosition = { dx: number; dy: number; page: number };

export type ZoneMidiAutos = {
  ch: number;
  cmd: number; // what gms sends: 176 for every 14-bit and NRPN mode
  p1: number[]; // one per source the default block sends: x and y on an xy
  mode: number;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

// The autos of zone `index` (au() in zona.lua). `mode` and `cmd` are the
// block's arguments; undefined or -1 means auto. The auto mode is 14-bit when
// res > 7 and the command is CC; other commands stay 7-bit.
export function zoneMidiAutos(
  zones: Zone[],
  index: number,
  pos: ZonePosition,
  mode?: number,
  cmd?: number,
): ZoneMidiAutos {
  const zone = zones[index];
  const read = readerOf(zone);
  const res = Number(zone.opt.res ?? zoneOptionDefault(zone.kind, "res"));
  const autoCmd = read === "gate" ? 144 : 176;
  const command = typeof cmd === "number" && cmd !== -1 ? cmd : autoCmd;
  const m =
    typeof mode === "number" && mode !== -1
      ? mode
      : res > 7 && command === 176
        ? 1
        : 0;
  let base = 0;
  for (const before of zones.slice(0, index)) {
    base += readerOf(before) === "point" ? 2 : 1;
  }
  const offsets = read === "point" ? [0, 1] : [0];
  return {
    ch: mod(pos.dy * 4 + pos.page, 16),
    cmd: m > 0 ? 176 : autoCmd,
    p1: offsets.map((o) => {
      const p = mod(32 + pos.dx * 16 + base + o, 128);
      return m === 1 ? p % 32 : p;
    }),
    mode: m,
  };
}

// "34/35" for an xy pad's two CCs, "33" otherwise. In 14-bit mode each
// source sends MSB and LSB: "1/33", or "2/34, 3/35" on an xy pad.
export function zoneP1Label(autos: ZoneMidiAutos): string {
  return autos.mode === 1
    ? autos.p1.map((p) => `${p}/${p + 32}`).join(", ")
    : autos.p1.join("/");
}

export type ZoneGetter = { value: string; info: string };

// Zone getters for value fields (RFC 4.1), per kind.
export function zoneGetterSuggestions(kind: ZoneKind): ZoneGetter[] {
  const v = { value: "self:v()", info: "Zone value (min to max)" };
  const g = { value: "self:g()", info: "Touched: 1 while held, 0 on release" };
  const d = {
    value: "self:d()",
    info: "Change since the last run (for relative targets)",
  };
  switch (kind) {
    case "xy":
      return [
        { value: "self:x()", info: "X value (min to max)" },
        { value: "self:y()", info: "Y value (min to max)" },
        g,
        d,
      ];
    case "button":
      return [v, { value: "self:step()", info: "Current step, 0 = off" }, g];
    default:
      return [v, g, d];
  }
}

// Argument `index` of a block's self:gms(ch,cmd,p1,p2,mode), or undefined
// when there is none or it isn't a number (an expression).
export function gmsArg(script: string, index: number): number | undefined {
  const start = script.indexOf("gms(");
  if (start === -1) {
    return undefined;
  }
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const c of script.slice(start + 4)) {
    if (c === "(" || c === "{" || c === "[") {
      depth++;
    } else if (c === ")" || c === "}" || c === "]") {
      if (depth === 0) {
        break;
      }
      depth--;
    }
    if (c === "," && depth === 0) {
      args.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  args.push(current);
  const arg = args[index]?.trim();
  return arg !== undefined && /^-?\d+$/.test(arg) ? Number(arg) : undefined;
}

export function gmsModeArg(script: string): number | undefined {
  return gmsArg(script, 4);
}
