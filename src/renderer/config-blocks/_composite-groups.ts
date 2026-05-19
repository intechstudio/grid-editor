import { type LuaScript, type ActionBlockInformation } from "./ActionBlockInformation";

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
        display: "Rotate Left",
        menuName: "Left/Right Rotate",
        helper: "Actions here are triggered when the encoder was rotated left.",
        iconKey: "rotate-left",
      },
      {
        short: "elrel",
        lua: "else",
        display: "Rotate Right",
        helper: "Actions here are triggered when the encoder was rotated right.",
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
        display: "Push & Rotate",
        menuName: "Push & Rotate",
        helper:
          "Actions here are triggered by rotating the encoder while it is pressed.",
        iconKey: "push-rotate",
      },
      {
        short: "eprel",
        lua: "else",
        display: "Just Rotate",
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
        display: "Push & Rotate Left",
        menuName: "Push & Rotate L R",
        helper:
          "Actions here are triggered by rotating the encoder left while it is pressed.",
        iconKey: "push-rot-left",
      },
      {
        short: "eprlrei1",
        lua: "elseif (self:bst()>0 and self:est()>63) then",
        display: "Push & Rotate Right",
        helper:
          "Actions here are triggered by rotating the encoder right while it is pressed.",
        iconKey: "push-rot-right",
      },
      {
        short: "eprlrei2",
        lua: "elseif (self:bst()==0 and self:est()<64) then",
        display: "Just Rotate Left",
        helper: "Actions here are triggered when the encoder is rotated left.",
        iconKey: "just-rot-left",
      },
      {
        short: "eprlrel",
        lua: "else",
        display: "Just Rotate Right",
        helper:
          "Actions here are triggered when the encoder is rotated right.",
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
];

// Auto-derives compositeLua from array order.
// Only the first part (composite_open) gets it; it references all remaining parts.
export function deriveCompositeLua(
  group: CompositeGroup
): LuaScript[] | undefined {
  const first = group.parts[0];
  if (!first) return undefined;
  return group.parts.slice(1).map((p) => ({
    short: p.short,
    script: p.lua,
  }));
}

// Returns the type based on position in the parts array.
export function deriveType(group: CompositeGroup, index: number): NonNullable<ActionBlockInformation["type"]> {
  if (index === 0) return "composite_open";
  if (index === group.parts.length - 1) return "composite_close";
  return "composite_part";
}
