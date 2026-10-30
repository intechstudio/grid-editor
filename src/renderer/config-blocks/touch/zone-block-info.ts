// Block information of the Touch blocks (docs/zona-touch-zones.md, Blocks). The block files in
// config-blocks/ (TouchFader.svelte, …) export these, so the zone kinds share
// one definition.

import {
  ElementType,
  EventType,
  ModuleType,
} from "@intechstudio/grid-protocol";
import type { ActionBlockInformation } from "../ActionBlockInformation";
import { categoryColors } from "../categoryColors";
import { type Zone, type ZoneKind, zoneRead } from "./zone-model";
import {
  defaultZoneScript,
  uniqueZoneScript,
  zoneBlockShort,
} from "./zone-blocks";
import { zoneSendProblem } from "./zone-validate";

const svg = (paths: string) =>
  `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;

export const touchIcons = {
  fader: svg(
    `<path d="M12 3v18"/><rect x="8" y="10" width="8" height="4" rx="1"/>`,
  ),
  button: svg(`<rect x="5" y="5" width="14" height="14" rx="3"/>`),
  xy: svg(
    `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/>`,
  ),
};

const DISPLAY_NAME: Record<ZoneKind, string> = {
  fader: "Touch Zone",
  button: "Touch Button",
};

// docs.intech.studio page of the touch blocks; each block has an anchor.
const DOCS = "https://docs.intech.studio/wiki/actions/touch/touch-zones";
const ANCHOR: Record<ZoneKind, string> = {
  fader: "touch-fader",
  button: "touch-button",
};

const TOUCH_SETUP = {
  elementTypes: [ElementType.TOUCH],
  eventTypes: [EventType.SETUP],
};

// Every Touch block is offered only on modules with a touch surface.
const COMMON = {
  moduleTypes: [ModuleType.ZONA] as ModuleType[],
  rendering: "standard",
  category: "touch",
  color: categoryColors["touch"],
  selectable: true,
  movable: true,
  hideIcon: false,
  editName: false,
  version: "2.0",
} as const;

// A zone block: one line, the zone and its options. The zone sends its MIDI
// itself.
export function zoneBlockInformation(kind: ZoneKind): ActionBlockInformation {
  return {
    ...COMMON,
    ...TOUCH_SETUP,
    // The Touch Zone block has a Button type; the old button block stays
    // only so saved configs keep their face.
    ...(kind === "button"
      ? {
          category: "deprecated" as const,
          color: categoryColors["deprecated"],
        }
      : {}),
    short: zoneBlockShort[kind],
    name: DISPLAY_NAME[kind].replace(/ /g, "_"),
    displayName: DISPLAY_NAME[kind],
    description:
      kind === "fader"
        ? "Zones on the touch surface: XY pads, faders and buttons, one or more in a block. Each sends MIDI from its options."
        : "Replaced by the Touch Zone block with Type: Button. A button zone on the touch surface.",
    documentationUrl: `${DOCS}#${ANCHOR[kind]}`,
    defaultLua: defaultZoneScript(kind, []),
    defaultLuaIn: (scripts) => defaultZoneScript(kind, scripts),
    blockIcon: kind === "fader" ? touchIcons.xy : touchIcons[kind],
    type: "single",
    toggleable: true,
    uniqueIn: uniqueZoneScript,
    contextProblem: zoneSendProblem,
  };
}

// The icon of a zone: an XY pad is a fader with dir "xy".
export function zoneIcon(zone: Zone): string {
  return zoneRead(zone) === "point" ? touchIcons.xy : touchIcons[zone.kind];
}
