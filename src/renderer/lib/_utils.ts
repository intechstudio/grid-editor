import {
  ElementType,
  EventType,
  EventTypeToNumber,
  grid,
  ModuleType,
} from "@intechstudio/grid-protocol";
import {
  GridAction,
  GridElement,
  GridEvent,
  GridModule,
  GridPage,
} from "../runtime/runtime";

export namespace Grid {
  export type UUID = string;
  export type LuaScript = string;

  export namespace Auto {
    export enum Value {
      MIDI_CHANNEL,
      MIDI_COMMAND,
      MIDI_P1,
      MIDI_P2,
      LED_RED,
      LED_GREEN,
      LED_BLUE,
    }

    export function getMidi(
      action: GridAction,
      param:
        | Value.MIDI_CHANNEL
        | Value.MIDI_COMMAND
        | Value.MIDI_P1
        | Value.MIDI_P2,
    ): number {
      const event = action.parent as GridEvent;
      const element = event.parent as GridElement;
      const page = element.parent as GridPage;
      const module = page.parent as GridModule;

      switch (param) {
        case Value.MIDI_CHANNEL: {
          const [module_position_y, page_current] = [
            module.dy,
            page.pageNumber,
          ];
          const ch = module_position_y * 4 + page_current;
          return ((ch % 16) + 16) % 16;
        }
        case Value.MIDI_COMMAND: {
          return event.type === EventTypeToNumber(EventType.BUTTON) ? 144 : 176;
        }
        case Value.MIDI_P1: {
          const [module_position_x, element_index] = [
            module.dx,
            element.elementIndex,
          ];
          const p1 = 32 + module_position_x * 16 + element_index;
          return ((p1 % 128) + 128) % 128;
        }
      }
    }

    export function getRGB(
      action: GridAction,
      param: Value.LED_RED | Value.LED_GREEN | Value.LED_BLUE,
    ) {
      const event = action.parent as GridEvent;
      const element = event.parent as GridElement;
      const page = element.parent as GridPage;

      const defaultColors: Array<
        Map<Value.LED_RED | Value.LED_GREEN | Value.LED_BLUE, number>
      > = [
        new Map([
          [Value.LED_RED, 0],
          [Value.LED_GREEN, 100],
          [Value.LED_BLUE, 200],
        ]),
        new Map([
          [Value.LED_RED, 200],
          [Value.LED_GREEN, 100],
          [Value.LED_BLUE, 0],
        ]),
        new Map([
          [Value.LED_RED, 50],
          [Value.LED_GREEN, 200],
          [Value.LED_BLUE, 50],
        ]),
        new Map([
          [Value.LED_RED, 100],
          [Value.LED_GREEN, 0],
          [Value.LED_BLUE, 200],
        ]),
      ];

      return defaultColors[page.pageNumber].get(param);
    }
  }

  export function toFirstCase(value: string) {
    return value[0].toUpperCase() + value.slice(1, value.length);
  }

  export const Brackets = [
    { start: "(", end: ")" },
    { start: "[", end: "]" },
    { start: "{", end: "}" },
  ];

  export enum Direction {
    LEFT = "left",
    RIGHT = "right",
    UP = "up",
    DOWN = "down",
  }

  export enum Position {
    LEFT = "left",
    RIGHT = "right",
    TOP = "top",
    BOTTOM = "bottom",
  }

  export enum Rotation {
    R0 = 0,
    R90 = 90,
    R180 = 180,
    R270 = 270,
  }

  export function numberToRotation(value: number) {
    switch (value % 4) {
      case 0:
        return Rotation.R0;
      case 1:
        return Rotation.R90;
      case 2:
        return Rotation.R180;
      case 3:
        return Rotation.R270;
    }
  }

  export function addRotations(
    a: Grid.Rotation,
    b: Grid.Rotation,
  ): Grid.Rotation {
    return (a + b) % 360;
  }

  export function rotateDirection(
    direction: Grid.Direction,
    rotation: Grid.Rotation,
  ): Grid.Direction {
    const directions = [
      Grid.Direction.UP,
      Grid.Direction.RIGHT,
      Grid.Direction.DOWN,
      Grid.Direction.LEFT,
    ];
    const index = directions.indexOf(direction);
    const steps = (rotation / 90) % 4;
    return directions[(index - steps + 4) % 4];
  }

  export function findNearestNeighbour<T>(
    arr: T[],
    index: number,
  ): T | undefined {
    const len = arr.length;

    for (let i = index + 1; i < len; i++) {
      if (arr[i] !== undefined) return arr[i];
    }

    for (let i = index - 1; i >= 0; i--) {
      if (arr[i] !== undefined) return arr[i];
    }

    return undefined;
  }

  export function parseBracketValues(value: string): string[] {
    if (value.length < 2) {
      throw "Value does not have valid starting and ending brackets";
    }

    const startBracket = value[0];
    const endBracket = value[value.length - 1];

    // Find the matching bracket pair
    const bracketPair = Brackets.find(
      (b) => b.start === startBracket && b.end === endBracket,
    );

    if (!bracketPair) {
      throw "Value does not have valid starting and ending brackets";
    }

    const result: string[] = [];
    let part = "";
    const stack: string[] = [];

    for (let i = 1; i < value.length - 1; ++i) {
      const char = value[i];

      // Check if character is a start or end bracket
      if (Brackets.some((b) => b.start === char)) {
        stack.push(char);
      } else if (
        Brackets.some((b) => b.end === char) &&
        stack.length > 0 &&
        Brackets.find((b) => b.start === stack[stack.length - 1])?.end === char
      ) {
        stack.pop();
      }

      // If a comma is found and no unclosed brackets, finalize the current part
      if (char === "," && stack.length === 0) {
        result.push(part.trim());
        part = "";
      } else {
        part += char;
      }
    }

    // Push the last part
    result.push(part.trim());

    return result;
  }

  export function isBracketClosed(value: string) {
    const pairs = [
      { start: "(", end: ")" },
      { start: "[", end: "]" },
      { start: "{", end: "}" },
    ];
    const stacks = new Map();

    // Initialize stacks for each pair
    pairs.forEach((pair) => {
      stacks.set(pair, []);
    });

    // Process each character in the input value
    for (const char of value) {
      // Find the corresponding pair for the current character
      const pair = pairs.find((e) => e.start === char || e.end === char);

      // If no pair is found (invalid character), continue
      if (!pair) continue;

      // Check if the character is a start or end bracket for the pair
      switch (char) {
        case pair.start:
          stacks.get(pair).push(char); // Push to the stack of the corresponding pair
          break;
        case pair.end:
          // Check if there's a corresponding start, and pop from the stack
          if (stacks.get(pair).length === 0) {
            return false; // Unmatched closing bracket
          }
          stacks.get(pair).pop();
          break;
      }
    }

    // Check if all stacks are empty, meaning all parentheses are closed correctly
    return [...stacks.values()].every((stack) => stack.length === 0);
  }

  export function getClosestEvent(events: number[], event: number) {
    if (events.map((e) => Number(e)).includes(Number(event))) {
      return event;
    }

    //Select closest event type if incoming device does not have the corrently selected event type
    const closestEvent = Math.min(
      ...events.map((e) => Number(e)).filter((e) => e > 0),
    );

    return closestEvent !== Infinity ? closestEvent : 0;
  }

  export class Int {
    static getRandom(start: number, end: number) {
      return Math.floor(Math.random() * end) + start;
    }
  }

  export namespace Protocol {
    export const maxScriptLength = grid.getProperty("CONFIG_LENGTH");

    export function getLayerSuggestions(type: ElementType) {
      switch (type) {
        case ElementType.BUTTON:
          return [
            { value: "1", info: "Button layer" },
            { value: "2", info: "Unused layer" },
          ];
        case ElementType.ENDLESS:
        case ElementType.ENCODER:
          return [
            { value: "1", info: "Button layer" },
            { value: "2", info: "Rotation layer" },
          ];
        case ElementType.FADER:
          return [
            { value: "1", info: "Fader layer" },
            { value: "2", info: "Unused layer" },
          ];

        case ElementType.POTMETER:
          return [
            { value: "1", info: "Potmeter layer" },
            { value: "2", info: "Unused layer" },
          ];
        default: {
          const defaultLayerSuggestion = [
            { value: "1", info: "Layer 1" },
            { value: "2", info: "Layer 2" },
          ];
          return defaultLayerSuggestion;
        }
      }
    }
  }

  export namespace Module {
    export enum Archetype {
      XX16 = "XX16",
      PBF4 = "PBF4",
      EF44 = "EF44",
      VSNX = "VSNX",
    }

    const typeToArchetypeMap = {
      [ModuleType.BU16]: Module.Archetype.XX16,
      [ModuleType.PO16]: Module.Archetype.XX16,
      [ModuleType.EN16]: Module.Archetype.XX16,
      [ModuleType.PBF4]: Module.Archetype.PBF4,
      [ModuleType.EF44]: Module.Archetype.EF44,
      [ModuleType.TEK1]: Module.Archetype.VSNX,
      [ModuleType.TEK2]: Module.Archetype.VSNX,
      [ModuleType.VSN0]: Module.Archetype.VSNX,
      [ModuleType.VSN1L]: Module.Archetype.VSNX,
      [ModuleType.VSN1R]: Module.Archetype.VSNX,
      [ModuleType.VSN2]: Module.Archetype.VSNX,
    };

    export function toArchetype(type: ModuleType): Module.Archetype {
      return typeToArchetypeMap[type];
    }
  }

  export namespace Link {
    export async function openExternalLink(link: string) {
      if (import.meta.env.VITE_BUILD_TARGET === "web") {
        window.open(link);
      } else {
        window.electron.openInBrowser(link);
      }
    }
  }

  export namespace Array {
    export function when<T = unknown>(condition: boolean, items: T[]): T[] {
      return condition ? items : [];
    }
  }
}
