// Block information of the Touch blocks (RFC 6.2 table). The block files in
// config-blocks/ (TouchFader.svelte, …) export these, so the four zone kinds
// share one definition.

import {
  ElementType,
  EventType,
  ModuleType,
} from "@intechstudio/grid-protocol";
import {
  type ActionBlockInformation,
  SyntaxPreprocessor,
} from "../ActionBlockInformation";
import { categoryColors } from "../categoryColors";
import type { ZoneKind } from "./zone-model";
import {
  defaultZoneScript,
  uniqueZoneScript,
  zoneBlockShort,
} from "./zone-blocks";
import { zoneSendProblem } from "./zone-validate";
import {
  ZONE_END_SCRIPT,
  ZONE_START_SCRIPT,
  ZONE_UTIL_SCRIPT,
  zoneGroupToLua,
  zoneTickToLua,
} from "./zone-parse";

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
  knob: svg(`<circle cx="12" cy="12" r="8"/><path d="M12 12l4-4"/>`),
  group: svg(
    `<rect x="3" y="7" width="8" height="10" rx="2"/><rect x="13" y="7" width="8" height="10" rx="2"/>`,
  ),
  start: svg(`<path d="M7 5l11 7-11 7z"/>`),
  tick: svg(`<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>`),
  utility: svg(
    `<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>`,
  ),
};

const DISPLAY_NAME: Record<ZoneKind, string> = {
  fader: "Touch Fader",
  button: "Touch Button",
  xy: "Touch XY Pad",
  knob: "Touch Knob",
};

// The default output: a MIDI block with autos (RFC 4.1).
const DEFAULT_BODY = { short: "gms", script: "self:gms(-1,-1,-1,-1)" };

const TOUCH_SETUP = {
  elementTypes: [ElementType.TOUCH],
  eventTypes: [EventType.SETUP],
};

// Every Touch block, the system element's Touch Utility too, is offered only
// on modules with a touch surface.
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

// What a zone body takes (RFC 6.2): outputs, Code, Comment, conditions and
// variables. Not the Library or Element Name (code), nor LED animations,
// which address the element's own LEDs, nor Self variables: self is the zone,
// and self.x=… would shadow its getters and state.
export const zoneBodyRule = {
  categories: ["midi", "led", "hid", "code", "condition", "variables"],
  excludeShorts: ["lib", "sn", "glat", "glap", "s"],
};

// The first zone brings Touch Start (end of Setup) and Touch Tick (Timer).
const ZONE_COMPANIONS = [
  { eventType: EventType.SETUP, short: "zst", script: ZONE_START_SCRIPT },
  {
    eventType: EventType.TIMER,
    short: "ztk",
    script: zoneTickToLua({ opt: {} }),
  },
];

// A zone block: its opening line, a default MIDI block as the body and the
// Touch End, inserted together by the action picker.
export function zoneBlockInformation(kind: ZoneKind): ActionBlockInformation {
  return {
    ...COMMON,
    ...TOUCH_SETUP,
    short: zoneBlockShort[kind],
    name: DISPLAY_NAME[kind].replace(/ /g, "_"),
    displayName: DISPLAY_NAME[kind],
    description: `A ${DISPLAY_NAME[kind].toLowerCase()} zone on the touch surface. The actions inside run with self = the zone.`,
    defaultLua: defaultZoneScript(kind, []),
    defaultLuaIn: (scripts) => defaultZoneScript(kind, scripts),
    compositeLua: [DEFAULT_BODY, { short: "zen", script: ZONE_END_SCRIPT }],
    blockIcon: touchIcons[kind],
    rounding: "top",
    type: "composite_open",
    toggleable: true,
    // The opening line is not Lua on its own: close it to check the syntax.
    syntaxPreprocessor: new SyntaxPreprocessor(`$SCRIPT$ ${ZONE_END_SCRIPT}`),
    bodyAccepts: zoneBodyRule,
    companions: ZONE_COMPANIONS,
    uniqueIn: uniqueZoneScript,
    contextProblem: zoneSendProblem,
  };
}

export const zoneEndInformation: ActionBlockInformation = {
  ...COMMON,
  short: "zen",
  name: "Touch_End",
  rendering: "modifier",
  category: null,
  displayName: "End",
  defaultLua: ZONE_END_SCRIPT,
  blockIcon: ``,
  selectable: false,
  movable: false,
  hideIcon: true,
  rounding: "bottom",
  type: "composite_close",
  toggleable: false,
  syntaxPreprocessor: new SyntaxPreprocessor(""),
};

export const touchGroupInformation: ActionBlockInformation = {
  ...COMMON,
  ...TOUCH_SETUP,
  short: "zgr",
  name: "Touch_Group",
  displayName: "Touch Group",
  description:
    "Settings of a radio group: Touch Buttons with the same group number",
  defaultLua: zoneGroupToLua({ n: 1, opt: {} }),
  blockIcon: touchIcons.group,
  type: "single",
  toggleable: true,
};

export const touchStartInformation: ActionBlockInformation = {
  ...COMMON,
  ...TOUCH_SETUP,
  short: "zst",
  name: "Touch_Start",
  displayName: "Touch Start",
  description: "Starts the touch zones defined above it",
  defaultLua: ZONE_START_SCRIPT,
  blockIcon: touchIcons.start,
  type: "single",
  toggleable: false,
  keepLast: true,
};

export const touchTickInformation: ActionBlockInformation = {
  ...COMMON,
  short: "ztk",
  name: "Touch_Tick",
  displayName: "Touch Tick",
  description:
    "Runs the touch zones' glide, flush and LEDs; the library re-arms the timer",
  defaultLua: zoneTickToLua({ opt: {} }),
  blockIcon: touchIcons.tick,
  type: "single",
  toggleable: true,
  elementTypes: [ElementType.TOUCH],
  eventTypes: [EventType.TIMER],
};

export const touchUtilityInformation: ActionBlockInformation = {
  ...COMMON,
  short: "zut",
  name: "Touch_Utility",
  displayName: "Touch Utility",
  description:
    "Utility button: touch a zone within the window to send its MIDI for mapping, or change page",
  defaultLua: ZONE_UTIL_SCRIPT,
  blockIcon: touchIcons.utility,
  type: "single",
  toggleable: true,
  elementTypes: [ElementType.SYSTEM],
  eventTypes: [EventType.UTILITY],
  // the mapping window is timed by Touch Tick (RFC 4.7)
  companions: [
    {
      eventType: EventType.TIMER,
      short: "ztk",
      script: zoneTickToLua({ opt: {} }),
      elementType: ElementType.TOUCH,
    },
  ],
};
