type HexColor = `#${string}`;

export interface LuaScript {
  short: string;
  script: string;
}

type EnsureNonOptional<T> = {
  [K in keyof T]: T[K] extends infer U | undefined ? U : T[K];
};

export type ActionBlockInformation = EnsureNonOptional<Information>;

interface Information {
  short: string;
  name: string;
  rendering: "modifier" | "standard";
  category:
    | "variables"
    | "led"
    | "midi"
    | "keyboard"
    | "mouse"
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
}
