type HexColor = `#${string}`;

export interface LuaScript {
  short: string;
  script: string;
}

export type ActionBlockInformation = Information;

export class SyntaxPreprocessor {
  constructor(public generatorString: string) {}

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
    | null;
  displayName: string;
  defaultLua: string;
  icon: string;
  color: HexColor;
  blockIcon: string;
  selectable: boolean;
  movable: boolean;
  type: "composite_part" | "composite_open" | "composite_close" | "single";
  toggleable: boolean;
  hideIcon: boolean;
  rounding?: "top" | "bottom";
  compositeLua?: LuaScript[];
  syntaxPreprocessor?: SyntaxPreprocessor;
}
