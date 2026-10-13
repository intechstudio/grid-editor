import type {
  ElementType,
  EventType,
  ModuleType,
} from "@intechstudio/grid-protocol";

export interface LuaScript {
  short: string;
  script: string;
}

export type ActionBlockInformation = Information;

export class SyntaxPreprocessor {
  constructor(public generatorString: string) {}

  // The text a bracket check should see: the generated script when the
  // generator wraps the script ($SCRIPT$), else the script itself. A generator
  // without $SCRIPT$ ("" on close blocks) drops the script, so checking its
  // output would check nothing.
  public bracketCheckText(script: string) {
    return this.generatorString.includes("$SCRIPT$")
      ? this.generate(script)
      : script;
  }

  public generate(script: string) {
    // Replace the placeholder "$SCRIPT$" with the provided script content.
    return this.generatorString.replace("$SCRIPT$", script);
  }
}

interface Information {
  short: string;
  name: string;
  menuName?: string;
  rendering: "modifier" | "standard";
  category:
    | "variables"
    | "led"
    | "midi"
    | "hid"
    | "element settings"
    | "condition"
    | "loop"
    | "special"
    | "code"
    | "timer"
    | "function"
    | "touch"
    | "deprecated"
    | null;
  displayName: string;
  defaultLua: string;
  // The script a block starts with when it is added to an event holding these
  // action scripts (a zone block's next free name); defaultLua otherwise.
  defaultLuaIn?: (scripts: string[]) => string;
  color: string;
  blockIcon: string;
  selectable: boolean;
  movable: boolean;
  type: "composite_part" | "composite_open" | "composite_close" | "single";
  toggleable: boolean;
  hideIcon: boolean;
  rounding?: "top" | "bottom";
  compositeLua?: LuaScript[];
  syntaxPreprocessor?: SyntaxPreprocessor;
  helperText?: string;
  devOnly?: boolean;
  hiddenInMinimalist?: boolean;
  valueRegex?: RegExp;
  editName: boolean;
  version?: string;
  description?: string;
  documentationUrl?: string;
  // Where the block may be added from the action picker; undefined = everywhere.
  elementTypes?: ElementType[];
  eventTypes?: EventType[];
  // Modules the block is offered on; undefined = every module.
  moduleTypes?: ModuleType[];
}
