// Block information of the Touch blocks (RFC 6.2 table). The block files in
// config-blocks/ (TouchFader.svelte, …) export these, so the three zone kinds
// share one definition.

import {
  ElementType,
  EventType,
  ModuleType,
} from "@intechstudio/grid-protocol";
import type { ActionBlockInformation } from "../ActionBlockInformation";
import { categoryColors } from "../categoryColors";
import type { ZoneKind } from "./zone-model";
import {
  defaultZoneScript,
  uniqueZoneScript,
  zoneBlockShort,
} from "./zone-blocks";
import { zoneSendProblem } from "./zone-validate";
import { zoneTickToLua } from "./zone-parse";

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
  tick: svg(`<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>`),
};

const DISPLAY_NAME: Record<ZoneKind, string> = {
  fader: "Touch Fader",
  button: "Touch Button",
  xy: "Touch XY Pad",
};

// docs.intech.studio page of the touch blocks; each block has an anchor.
const DOCS = "https://docs.intech.studio/wiki/actions/touch/touch-zones";
const ANCHOR: Record<ZoneKind, string> = {
  fader: "touch-fader",
  button: "touch-button",
  xy: "touch-xy",
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

// The first zone brings Touch Tick (Timer).
const ZONE_COMPANIONS = [
  {
    eventType: EventType.TIMER,
    short: "ztk",
    script: zoneTickToLua({ opt: {} }),
  },
];

// A zone block: one line, the zone and its options. The zone sends its MIDI
// itself.
export function zoneBlockInformation(kind: ZoneKind): ActionBlockInformation {
  return {
    ...COMMON,
    ...TOUCH_SETUP,
    short: zoneBlockShort[kind],
    name: DISPLAY_NAME[kind].replace(/ /g, "_"),
    displayName: DISPLAY_NAME[kind],
    description: `A ${DISPLAY_NAME[kind].toLowerCase()} zone on the touch surface. It sends MIDI from its options.`,
    documentationUrl: `${DOCS}#${ANCHOR[kind]}`,
    defaultLua: defaultZoneScript(kind, []),
    defaultLuaIn: (scripts) => defaultZoneScript(kind, scripts),
    blockIcon: touchIcons[kind],
    type: "single",
    toggleable: true,
    companions: ZONE_COMPANIONS,
    uniqueIn: uniqueZoneScript,
    contextProblem: zoneSendProblem,
  };
}

export const touchTickInformation: ActionBlockInformation = {
  ...COMMON,
  short: "ztk",
  name: "Touch_Tick",
  displayName: "Touch Tick",
  documentationUrl: `${DOCS}#touch-tick`,
  description:
    "Runs the touch zones' glide, flush and LEDs; the library re-arms the timer",
  defaultLua: zoneTickToLua({ opt: {} }),
  blockIcon: touchIcons.tick,
  type: "single",
  toggleable: true,
  elementTypes: [ElementType.TOUCH],
  eventTypes: [EventType.TIMER],
};
