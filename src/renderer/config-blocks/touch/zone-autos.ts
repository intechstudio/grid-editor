// What a zone sends and what its body can read (RFC 4.1): the zone's MIDI
// identity, mirroring Z.zone in libraries/zona/zona.lua, and the zone getters
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

// What a zone sends (Z.zone in zona.lua): cc14 is a CC pair, MSB on each
// number and LSB on number+32; pb is pitch bend (no number).
export type ZoneMidi = {
  ch: number;
  type: "note" | "cc" | "cc14" | "pb";
  nums: number[]; // one per source: x and y on an xy pad
  fingers: number; // xy: finger k sends on channel ch+k-1 (mod 16)
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

function option(zone: Zone, key: string) {
  return zone.opt[key] ?? zoneOptionDefault(zone.kind, key);
}

// The MIDI identity of zone `index`, null for msg="none". Autos: channel
// from the module row and page, number from the module column and the CC
// slot (zones before it: xy 2, others 1, whatever they send), % 32 for a
// 14-bit pair.
export function zoneMidi(
  zones: Zone[],
  index: number,
  pos: ZonePosition,
): ZoneMidi | null {
  const zone = zones[index];
  const msg = String(option(zone, "msg"));
  if (msg === "none") {
    return null;
  }
  const res = msg === "pb" ? 14 : Number(option(zone, "res"));
  const type =
    msg === "pb" ? "pb" : msg === "note" ? "note" : res > 7 ? "cc14" : "cc";
  let base = 0;
  for (const before of zones.slice(0, index)) {
    base += readerOf(before) === "point" ? 2 : 1;
  }
  // xy: y on the next number, an auto one wrapped like the auto itself
  const auto = (n: number) => mod(n, 128) % (type === "cc14" ? 32 : 128);
  const num = Number(option(zone, "num"));
  const [x, y] =
    num < 0
      ? [auto(32 + pos.dx * 16 + base), auto(32 + pos.dx * 16 + base + 1)]
      : [num, num + 1];
  const ch = Number(option(zone, "ch"));
  return {
    ch: ch < 0 ? mod(pos.dy * 4 + pos.page, 16) : ch,
    type,
    nums: type === "pb" ? [] : readerOf(zone) === "point" ? [x, y] : [x],
    fingers: readerOf(zone) === "point" ? Number(option(zone, "fingers")) : 1,
  };
}

// The identity of the zone line at `at` in an event's scripts; undefined
// when that line isn't a zone.
export function zoneMidiAt(
  scripts: string[],
  at: number,
  pos: ZonePosition,
): ZoneMidi | null | undefined {
  if (parseZone(scripts[at] ?? "") === null) {
    return undefined;
  }
  const zones = scripts
    .slice(0, at + 1)
    .map((e) => parseZone(e))
    .filter((e): e is Zone => e !== null);
  return zoneMidi(zones, zones.length - 1, pos);
}

// 1-based channel or range: "1", "1–3", "15–16, 1" (fingers wrap at 16).
function channels(midi: ZoneMidi): string {
  const first = midi.ch + 1;
  const last = mod(midi.ch + midi.fingers - 1, 16) + 1;
  if (midi.fingers <= 1) {
    return String(first);
  }
  if (last >= first) {
    return `${first}–${last}`;
  }
  const range = (a: number, b: number) => (a === b ? `${a}` : `${a}–${b}`);
  return `${range(first, 16)}, ${range(1, last)}`;
}

// Short text of what a zone sends: "CC 33 ch 1", "CC 1/33 ch 1" (14-bit),
// "CC 34, 35 ch 1" (xy), "Note 36 ch 1", "PB ch 1", "no MIDI". The channel
// is 1-based, as the MIDI block shows it.
export function zoneMidiLabel(midi: ZoneMidi | null): string {
  if (midi === null) {
    return "no MIDI";
  }
  const ch = `ch ${channels(midi)}`;
  if (midi.type === "pb") {
    return `PB ${ch}`;
  }
  const nums = midi.nums
    .map((n) => (midi.type === "cc14" ? `${n}/${n + 32}` : String(n)))
    .join(", ");
  return `${midi.type === "note" ? "Note" : "CC"} ${nums} ${ch}`;
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
        {
          value: "self:dx()",
          info: "Change of x since the last run, for Mouse Move X",
        },
        {
          value: "self:dy()",
          info: "Change of y since the last run, for Mouse Move Y",
        },
        { value: "self:f()", info: "Finger number, 1 to the zone's fingers" },
      ];
    case "button":
      return [v, { value: "self:step()", info: "Current step, 0 = off" }, g];
    default:
      return [v, g, d];
  }
}
