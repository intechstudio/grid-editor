import convert from "color-convert";
import { grid } from "@intechstudio/grid-protocol";
import { MeltComboSuggestion } from "@intechstudio/grid-uikit";

export namespace Grid {
  export function toFirstCase(value: string) {
    return value[0].toUpperCase() + value.slice(1, value.length);
  }

  export const Brackets = [
    { start: "(", end: ")" },
    { start: "[", end: "]" },
    { start: "{", end: "}" },
  ];

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

  export class RGB {
    constructor(
      public r: number,
      public g: number,
      public b: number,
    ) {}

    toCSS() {
      return `rgb(${this.r ?? 0}, ${this.g ?? 0}, ${this.b ?? 0})`;
    }

    toHEX() {
      return `#${convert.rgb.hex(this.r, this.g, this.b)}`;
    }

    toHSL() {
      const hsl = convert.rgb.hsl(this.r, this.g, this.b);
      return new HSL(hsl[0], hsl[1], hsl[2]);
    }

    toRGBA() {
      return new RGBA(this.r, this.g, this.b, 1);
    }

    static getRandom() {
      return new RGB(
        Int.getRandom(0, 255),
        Int.getRandom(0, 255),
        Int.getRandom(0, 255),
      );
    }
  }

  export class RGBA {
    constructor(
      public r: number,
      public g: number,
      public b: number,
      public a: number,
    ) {
      return undefined;
    }

    toCSS() {
      return `rgba(${this.r ?? 0}, ${this.g ?? 0}, ${this.b ?? 0}, ${
        this.a ?? 0
      })`;
    }

    toHSLA() {
      const hsl = convert.rgb.hsl(this.r, this.g, this.b);
      return new HSLA(hsl[0], hsl[1], hsl[2], this.a);
    }

    reduceToRGB() {
      return new RGB(this.r, this.g, this.b);
    }

    reduceToHSL() {
      return this.reduceToRGB().toHSL();
    }
  }

  export class HSLA {
    constructor(
      public h: number,
      public s: number,
      public l: number,
      public a: number,
    ) {}

    toRGBA() {
      const rgb = convert.hsl.rgb(this.h, this.s, this.l);
      return new RGBA(rgb[0], rgb[1], rgb[2], this.a);
    }

    toCSS() {
      return `hsla(${this.h}deg, ${this.s}%, ${this.l}%, ${this.a})`;
    }

    reduceToRGB() {
      return this.reduceToHSL().toRGB();
    }

    reduceToHSL() {
      return new HSL(this.h, this.s, this.l);
    }
  }

  export enum HSLParam {
    HUE,
    SATURATION,
    LIGHTNESS,
  }

  export class HSL {
    constructor(
      public h: number,
      public s: number,
      public l: number,
    ) {}

    getParam(param: HSLParam) {
      switch (param) {
        case HSLParam.HUE:
          return this.h;
        case HSLParam.SATURATION:
          return this.s;
        case HSLParam.LIGHTNESS:
          return this.l;
      }
    }

    setParam(param: HSLParam, value: number) {
      switch (param) {
        case HSLParam.HUE:
          this.h = value;
          break;
        case HSLParam.SATURATION:
          this.s = value;
          break;
        case HSLParam.LIGHTNESS:
          this.l = value;
          break;
      }
      return this;
    }

    static getMaxValue(param: HSLParam) {
      switch (param) {
        case HSLParam.HUE:
          return 360;
        case HSLParam.SATURATION:
          return 100;
        case HSLParam.LIGHTNESS:
          return 100;
      }
    }

    toRGB(): RGB {
      const rgb = convert.hsl.rgb(this.h, this.s, this.l);
      return new RGB(rgb[0], rgb[1], rgb[2]);
    }

    toHEX() {
      return `#${convert.hsl.hex(this.h, this.s, this.l)}`;
    }

    toCSS() {
      return `hsl(${this.h}deg, ${this.s}%, ${this.l}%)`;
    }

    toHSLA() {
      return new HSLA(this.h, this.s, this.l, 1);
    }

    toRGBA() {
      return this.toRGB().toRGBA();
    }
  }

  export class Int {
    static getRandom(start: number, end: number) {
      return Math.floor(Math.random() * end) + start;
    }
  }

  export function parseRGB(r: any, g: any, b: any): RGB | undefined {
    if (![r, g, b].map((e) => parseInt(e)).every((e) => Number.isFinite(e))) {
      return undefined;
    }

    return new RGB(parseInt(r), parseInt(g), parseInt(b));
  }

  export namespace Protocol {
    export const scriptStart = "<?lua ";
    export const scriptEnd = " ?>";
    export const maxScriptLength =
      grid.getProperty("CONFIG_LENGTH") - scriptEnd.length - scriptStart.length;
  }

  //TODO: Move it to ui-kit?
  export namespace Types {
    export type MeltComboData = {
      value: string;
      suggestions: MeltComboSuggestion[];
      title?: string;
      validator: {
        value: boolean;
        func?: (e: string) => boolean;
      };
    };
  }
}
