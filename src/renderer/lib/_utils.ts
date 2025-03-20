import convert from "color-convert";
import { checkVariableName } from "../validators/local_validator.mjs";
import { parenthesis } from "../config-blocks/validators";
import { find_forbidden_identifiers } from "../runtime/monaco-helper";
import { grid } from "@intechstudio/grid-protocol";

export namespace Grid {
  export function toFirstCase(value: string) {
    return value[0].toUpperCase() + value.slice(1, value.length);
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
    public r: number;
    public g: number;
    public b: number;

    constructor(r: number, g: number, b: number) {
      this.r = r;
      this.g = g;
      this.b = b;
    }

    toCSS() {
      return `rgb(${this.r ?? 0}, ${this.g ?? 0}, ${this.b ?? 0})`;
    }

    toHEX() {
      return `#${convert.rgb.hex(this.r, this.g, this.b)}`;
    }

    toHSL(): HSL {
      const hsl = convert.rgb.hsl(this.r, this.g, this.b);
      return new HSL(hsl[0], hsl[1], hsl[2]);
    }

    static getRandom(): RGB {
      return new RGB(
        Int.getRandom(0, 255),
        Int.getRandom(0, 255),
        Int.getRandom(0, 255),
      );
    }
  }

  export enum HSLParam {
    HUE,
    SATURATION,
    LIGHTNESS,
  }

  export class HSL {
    public h: number;
    public s: number;
    public l: number;

    constructor(h: number, s: number, l: number) {
      this.h = h;
      this.s = s;
      this.l = l;
    }

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
      const rgb = this.toRGB();
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
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

  export namespace VariableBlock {
    export type Error = {
      value: boolean;
      text: string;
    };

    export type ScriptSegment = { variable: string; value: string };

    export function localArrayToScript(arr: ScriptSegment[]) {
      let script = [
        "local ",
        arr.map((e) => e.variable).join(","),
        "=",
        arr.map((e) => e.value).join(","),
      ].join("");
      return script;
    }

    export function getError(scriptSegments: ScriptSegment[]): Error {
      let variableNameValidity = [];
      scriptSegments.forEach((s) => {
        variableNameValidity.push(checkVariableName(s.variable));
      });

      const script = localArrayToScript(scriptSegments);

      if (variableNameValidity.includes(false)) {
        return { value: true, text: "Invalid variable name!" };
      }

      if (!parenthesis(script)) {
        return { value: true, text: "Parenthesis must be closed!" };
      }

      let forbiddenList = find_forbidden_identifiers(script);

      if (forbiddenList.length > 0) {
        const uniqueForbiddenList = [...new Set(forbiddenList)];
        const readable = uniqueForbiddenList.toString().replace(",", ", ");
        return {
          value: true,
          text: "Reserved identifiers [" + readable + "] cannot be used!",
        };
      }

      return { value: false, text: "OK" };
    }
  }

  export namespace Protocol {
    export const scriptStart = "<?lua ";
    export const scriptEnd = " ?>";
    export const maxScriptLength =
      grid.getProperty("CONFIG_LENGTH") - scriptEnd.length - scriptStart.length;
  }
}
