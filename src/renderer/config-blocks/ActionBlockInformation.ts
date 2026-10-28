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

  public generate(script: string) {
    // Replace the placeholder "$SCRIPT$" with the provided script content.
    return this.generatorString.replace("$SCRIPT$", script);
  }
}

export type Companion = {
  eventType: EventType;
  short: string;
  script: string;
  // Another element of the page: the first of this type (Touch Utility, on
  // the system element, brings Touch Tick to the touch element). Default:
  // the element the block is added to.
  elementType?: ElementType;
};

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
  // Kept the last block of its event: the picker adds new blocks before it.
  keepLast?: boolean;
  // Added with this block from the picker when the element's event of that
  // type has no block with this short (Touch Start and Touch Tick with the
  // first zone). Appended at the end of that event.
  companions?: Companion[];
  // When existing actions are inserted (paste, snippet, drop), rewrites the
  // script so it doesn't collide with these other scripts of the event (a
  // pasted zone's name).
  uniqueIn?: (script: string, others: string[]) => string;
  // A problem the block has because of the rest of its event (a duplicate
  // zone name). While there is one, the action is invalid, so the event is
  // not sent.
  contextProblem?: (
    script: string,
    eventScripts: string[],
  ) => string | undefined;
}

// The scripts of actions inserted next to `existing` (paste, snippet, drop):
// in order, each one's uniqueIn sees the event and the ones before it.
// GridEvent.makeUnique rewrites only those that changed (insertRewrites).
export function uniqueScripts(
  existing: string[],
  items: { script: string; uniqueIn?: Information["uniqueIn"] }[],
): string[] {
  const seen = [...existing];
  return items.map(({ script, uniqueIn }) => {
    const unique = uniqueIn?.(script, seen) ?? script;
    seen.push(unique);
    return unique;
  });
}

// Which inserted items get a new script, as [index, script]. Only these are
// rewritten: a rewrite also resets the action's synced script, and a moved
// action with an unsent edit must keep its own.
export function insertRewrites(
  existing: string[],
  items: { script: string; uniqueIn?: Information["uniqueIn"] }[],
): [number, string][] {
  return uniqueScripts(existing, items)
    .map((script, i): [number, string] => [i, script])
    .filter(([i, script]) => script !== items[i].script);
}
