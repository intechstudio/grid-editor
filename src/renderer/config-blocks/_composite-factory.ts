import {
  type ActionBlockInformation,
  SyntaxPreprocessor,
} from "./ActionBlockInformation";
import {
  type CompositePartData,
  compositeGroups,
  deriveCompositeLua,
  deriveType,
} from "./_composite-groups";
import { COMPOSITE_ICONS } from "./_composite-icons";
import CompositeFace from "./headers/CompositeFace.svelte";
import type { SvelteComponent } from "svelte";

// Shared defaults for all composite parts.
const SHARED: Partial<ActionBlockInformation> = {
  rendering: "modifier",
  toggleable: false,
  syntaxPreprocessor: new SyntaxPreprocessor(""),
  editName: false,
  version: "2.0",
};

export interface CompositePartResult {
  information: ActionBlockInformation;
  header: typeof SvelteComponent;
}

function buildPart(
  group: (typeof compositeGroups)[0],
  data: CompositePartData,
  index: number,
): CompositePartResult {
  const type = deriveType(group, index);
  const isFirst = index === 0;
  const isLast = index === group.parts.length - 1;

  const icon = COMPOSITE_ICONS[data.iconKey];

  const info: ActionBlockInformation = {
    ...SHARED,
    short: data.short,
    name: `${group.name}_${type === "composite_open" ? "If" : type === "composite_close" ? "End" : "Else"}`,
    rendering: SHARED.rendering!,
    category: isFirst ? "special" : null,
    displayName: data.display,
    defaultLua: data.lua,
    icon,
    color: group.color as `#${string}`,
    blockIcon: icon,
    selectable: isFirst,
    movable: isFirst,
    type,
    toggleable: SHARED.toggleable!,
    hideIcon: isLast,
    rounding: isFirst ? "top" : isLast ? "bottom" : undefined,
    editName: SHARED.editName!,
    version: SHARED.version!,
    syntaxPreprocessor: SHARED.syntaxPreprocessor!,
    // Only the open block gets compositeLua, auto-derived from array order.
    compositeLua: isFirst ? deriveCompositeLua(group) : undefined,
    // Optional fields.
    menuName: data.menuName,
    helperText: data.helper,
    description: data.description,
  };

  return { information: info, header: CompositeFace };
}

export function getCompositePart(
  short: string,
): CompositePartResult | undefined {
  for (const group of compositeGroups) {
    for (let i = 0; i < group.parts.length; i++) {
      if (group.parts[i].short === short) {
        return buildPart(group, group.parts[i], i);
      }
    }
  }
  return undefined;
}
