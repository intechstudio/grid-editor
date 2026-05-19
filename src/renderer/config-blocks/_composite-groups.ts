import {
  type LuaScript,
  type ActionBlockInformation,
} from "./ActionBlockInformation";

export interface CompositePartData {
  short: string;
  lua: string;
  display: string;
  menuName?: string;
  helper?: string;
  iconKey: string;
}

export interface CompositeGroup {
  name: string;
  color: string;
  parts: CompositePartData[];
}

export const compositeGroups: CompositeGroup[] = [
  {
    name: "EncoderLeftRight",
    color: "#4A4AA7",
    parts: [
      {
        short: "elr",
        lua: "if self:est()<64 then",
        display: "Encoder Rotate Left",
        menuName: "Encoder Left/Right Rotate",
        helper: "Actions here are triggered when the encoder was rotated left.",
        iconKey: "rotate-left",
      },
      {
        short: "elrel",
        lua: "else",
        display: "Encoder Rotate Right",
        helper:
          "Actions here are triggered when the encoder was rotated right.",
        iconKey: "rotate-right",
      },
      {
        short: "elre",
        lua: "end",
        display: "End",
        iconKey: "end",
      },
    ],
  },
  {
    name: "EncoderPushRot",
    color: "#4A4AA7",
    parts: [
      {
        short: "epr",
        lua: "if self:bst()>0 then",
        display: "Encoder Push & Rotate",
        menuName: "Encoder Push & Rotate",
        helper:
          "Actions here are triggered by rotating the encoder while it is pressed.",
        iconKey: "push-rotate",
      },
      {
        short: "eprel",
        lua: "else",
        display: "Encoder Just Rotate",
        helper: "Actions here are triggered when the encoder is rotated.",
        iconKey: "just-rotate",
      },
      {
        short: "epre",
        lua: "end",
        display: "End",
        iconKey: "end",
      },
    ],
  },
  {
    name: "EncoderPushRotLeftRight",
    color: "#4A4AA7",
    parts: [
      {
        short: "eprlr",
        lua: "if (self:bst()>0 and self:est()<64) then",
        display: "Encoder Push & Rotate Left",
        menuName: "Encoder Push & Rotate L R",
        helper:
          "Actions here are triggered by rotating the encoder left while it is pressed.",
        iconKey: "push-rot-left",
      },
      {
        short: "eprlrei1",
        lua: "elseif (self:bst()>0 and self:est()>63) then",
        display: "Encoder Push & Rotate Right",
        helper:
          "Actions here are triggered by rotating the encoder right while it is pressed.",
        iconKey: "push-rot-right",
      },
      {
        short: "eprlrei2",
        lua: "elseif (self:bst()==0 and self:est()<64) then",
        display: "Encoder Just Rotate Left",
        helper: "Actions here are triggered when the encoder is rotated left.",
        iconKey: "just-rot-left",
      },
      {
        short: "eprlrel",
        lua: "else",
        display: "Encoder Just Rotate Right",
        helper: "Actions here are triggered when the encoder is rotated right.",
        iconKey: "just-rot-right",
      },
      {
        short: "eprlre",
        lua: "end",
        display: "End",
        iconKey: "end",
      },
    ],
  },
  {
    name: "ButtonPressRelease",
    color: "#4A4AA7",
    parts: [
      {
        short: "bpr",
        lua: "if self:bst()>0 then",
        display: "Press",
        menuName: "Press/Release",
        helper: "Actions here are triggered when the button is pressed.",
        iconKey: "button-press",
      },
      {
        short: "bprel",
        lua: "else",
        display: "Release",
        helper: "Actions here are triggered when the button is released.",
        iconKey: "button-release",
      },
      {
        short: "bpre",
        lua: "end",
        display: "End",
        iconKey: "end",
      },
    ],
  },
  // --- Endless potentiometer groups (epst instead of est) ---
  {
    name: "EndlessLeftRight",
    color: "#4A4AA7",
    parts: [
      {
        short: "eplr",
        lua: "if self:epst()<64 then",
        display: "Endless Rotate Left",
        menuName: "Endless Left/Right Rotate",
        helper:
          "Actions here are triggered when the endless potentiometer was rotated left.",
        iconKey: "rotate-left",
      },
      {
        short: "eplrel",
        lua: "else",
        display: "Endless Rotate Right",
        helper:
          "Actions here are triggered when the endless potentiometer was rotated right.",
        iconKey: "rotate-right",
      },
      {
        short: "eplre",
        lua: "end",
        display: "End",
        iconKey: "end",
      },
    ],
  },
  {
    name: "EndlessPushRot",
    color: "#4A4AA7",
    parts: [
      {
        short: "eppr",
        lua: "if self:bst()>0 then",
        display: "Endless Push & Rotate",
        menuName: "Endless Push & Rotate",
        helper:
          "Actions here are triggered by rotating the endless potentiometer while it is pressed.",
        iconKey: "push-rotate",
      },
      {
        short: "epprel",
        lua: "else",
        display: "Endless Just Rotate",
        helper:
          "Actions here are triggered when the endless potentiometer is rotated.",
        iconKey: "just-rotate",
      },
      {
        short: "eppre",
        lua: "end",
        display: "End",
        iconKey: "end",
      },
    ],
  },
  {
    name: "EndlessPushRotLeftRight",
    color: "#4A4AA7",
    parts: [
      {
        short: "epprlr",
        lua: "if (self:bst()>0 and self:epst()<64) then",
        display: "Endless Push & Rotate Left",
        menuName: "Endless Push & Rotate L R",
        helper:
          "Actions here are triggered by rotating the endless potentiometer left while it is pressed.",
        iconKey: "push-rot-left",
      },
      {
        short: "epprlrei1",
        lua: "elseif (self:bst()>0 and self:epst()>63) then",
        display: "Endless Push & Rotate Right",
        helper:
          "Actions here are triggered by rotating the endless potentiometer right while it is pressed.",
        iconKey: "push-rot-right",
      },
      {
        short: "epprlrei2",
        lua: "elseif (self:bst()==0 and self:epst()<64) then",
        display: "Endless Just Rotate Left",
        helper:
          "Actions here are triggered when the endless potentiometer is rotated left.",
        iconKey: "just-rot-left",
      },
      {
        short: "epprlrel",
        lua: "else",
        display: "Endless Just Rotate Right",
        helper:
          "Actions here are triggered when the endless potentiometer is rotated right.",
        iconKey: "just-rot-right",
      },
      {
        short: "epprlre",
        lua: "end",
        display: "End",
        iconKey: "end",
      },
    ],
  },
];

// Auto-derives compositeLua from array order.
// Only the first part (composite_open) gets it; it references all remaining parts.
export function deriveCompositeLua(
  group: CompositeGroup,
): LuaScript[] | undefined {
  const first = group.parts[0];
  if (!first) return undefined;
  return group.parts.slice(1).map((p) => ({
    short: p.short,
    script: p.lua,
  }));
}

// Returns the type based on position in the parts array.
export function deriveType(
  group: CompositeGroup,
  index: number,
): NonNullable<ActionBlockInformation["type"]> {
  if (index === 0) return "composite_open";
  if (index === group.parts.length - 1) return "composite_close";
  return "composite_part";
}
