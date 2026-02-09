import {
  writable,
  type Writable,
  type Subscriber,
  type Unsubscriber,
  type Updater,
  type Readable,
  get,
} from "svelte/store";
import { Grid } from "../lib/_utils";
import {
  GridAction,
  GridElement,
  GridEvent,
  GridPage,
} from "../runtime/runtime";
import { Script } from "./_script_parsers";
import { Validator } from "./validators";
import { LocalDefinitions } from "../runtime/runtime.store";
import { type MeltComboData, Color } from "@intechstudio/grid-uikit";

export namespace SimpleColor {
  export enum Channel {
    RED = "red",
    GREEN = "green",
    BLUE = "blue",
    ALPHA = "alpha",
  }

  export function toChannel(value: string): Channel | undefined {
    const values = Object.values(Channel) as string[];
    return values.includes(value) ? (value as Channel) : undefined;
  }

  export type Color = {
    red: string;
    green: string;
    blue: string;
    alpha: string;
  };

  export function colorToCSS(color: Color) {
    if (Object.values(color).some((e) => isNaN(Number(e)))) {
      return "white";
    } else {
      return `rgba(${Object.values(color).join(",")})`;
    }
  }

  export class ParsedData {
    public colors: Array<{
      red: string;
      green: string;
      blue: string;
      alpha: string;
    }>;
    public layer: number;
    public element: string;
    public updateIntenstiy: boolean;

    constructor(action: GridAction) {
      let actionstring = action.script;

      this.updateIntenstiy = actionstring.includes("glp");
      if (this.updateIntenstiy) {
        // Extract just the glc(...) call with balanced parens
        const glcIndex = actionstring.indexOf("glc(");
        if (glcIndex !== -1) {
          let depth = 0;
          let end = glcIndex;
          for (let i = glcIndex; i < actionstring.length; i++) {
            if (actionstring[i] === "(") depth++;
            else if (actionstring[i] === ")") {
              depth--;
              if (depth === 0) {
                end = i + 1;
                break;
              }
            }
          }
          actionstring = actionstring.slice(0, end);
        }
      }

      const segments = Script.toSegments({
        short: `glc`,
        script: actionstring.match(/glc\(.*\)$/)[0],
      });

      this.colors = Grid.parseBracketValues(segments[1]).map((e) => {
        const values = Grid.parseBracketValues(e);
        return {
          red: values[0],
          green: values[1],
          blue: values[2],
          alpha: values[3],
        };
      });

      this.layer = segments[0];
      this.element = actionstring.match(/(.*?)glc/)[1].slice(0, -1);
    }
  }

  function getElementSuggestions(page: GridPage) {
    return [
      { info: "Self (Default)", value: "self" },
      ...page.control_elements.map((e) =>
        Object({
          info: e.getHumanName(),
          value: `element[${e.elementIndex}]`,
        }),
      ),
    ];
  }

  function getLayerSuggestions(element: GridElement) {
    return Grid.Protocol.getLayerSuggestions(element.type);
  }

  function getRGBASuggestions(action: GridAction, channel: Channel) {
    const event = action.parent as GridEvent;
    const actions = event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    const typeMap = new Map<
      Channel,
      | Grid.Auto.Value.LED_RED
      | Grid.Auto.Value.LED_GREEN
      | Grid.Auto.Value.LED_BLUE
    >([
      [Channel.RED, Grid.Auto.Value.LED_RED],
      [Channel.GREEN, Grid.Auto.Value.LED_GREEN],
      [Channel.BLUE, Grid.Auto.Value.LED_BLUE],
    ]);

    if (channel === Channel.ALPHA) {
      return localDefinitions;
    } else {
      return [
        {
          value: "-1",
          info: `Auto (${Grid.Auto.getRGB(action, typeMap.get(channel))})`,
          key: "auto",
        },
        ...localDefinitions,
      ];
    }
  }

  export type ViewModelData = {
    colors: Array<Color>;
    previewColors: Array<Color>;
    layer: MeltComboData;
    element: MeltComboData;
    selectedIndex: number;
    pickerColor: Color.HSL | undefined;
    alphaSliderValue: number | undefined;
    red: MeltComboData;
    green: MeltComboData;
    blue: MeltComboData;
    alpha: MeltComboData;
    updateIntensity: boolean;
  };

  export class ViewModel implements Readable<ViewModelData> {
    protected _internal: Writable<ViewModelData> = writable();
    protected unsubscribers: Unsubscriber[] = [];

    constructor(action: GridAction) {
      this.updateData(action);
    }

    public subscribe(
      run: Subscriber<ViewModelData>,
      invalidate?: (value?: ViewModelData) => void,
    ): Unsubscriber {
      return this._internal.subscribe(run, invalidate);
    }

    //Must be called at the end of lifecycle
    public destroy() {
      this.unsubscribers.forEach((unsubsribe) => unsubsribe());
    }

    public set(value: ViewModelData) {
      this._internal.set(value);
    }

    public update(updater: Updater<ViewModelData>) {
      this._internal.update(updater);
    }

    public updateData(action: GridAction) {
      const parsed = new ParsedData(action);
      const event = action.parent as GridEvent;
      const element = event.parent as GridElement;
      const page = element.parent as GridPage;

      const selectedIndex = parsed.colors.length - 1;
      const updateIntensity = parsed.updateIntenstiy;
      const { red, green, blue, alpha } = parsed.colors[selectedIndex];
      const pickerColor = [red, green, blue].some((e) => isNaN(parseFloat(e)))
        ? undefined
        : new Color.RGB(parseInt(red), parseInt(green), parseInt(blue)).toHSL();
      const alphaSliderValue = isNaN(parseFloat(alpha))
        ? undefined
        : parseFloat(alpha);
      const getValidator = (value: string) => ({
        value: new Validator(value).isLuaValue().Result(),
        func: (e: string) => new Validator(e).isLuaValue().Result(),
      });

      const getColorData = (value: string, channel: Channel) => ({
        value,
        suggestions: getRGBASuggestions(action, channel),
        validator: getValidator(value),
      });

      this.set({
        colors: parsed.colors.map((e) =>
          Object({
            red: e.red,
            green: e.green,
            blue: e.blue,
            alpha: e.alpha,
          }),
        ),
        previewColors: parsed.colors.map((e) =>
          Object({
            ...e,
            red:
              e.red === "-1"
                ? String(Grid.Auto.getRGB(action, Grid.Auto.Value.LED_RED))
                : e.red,
            green:
              e.green === "-1"
                ? String(Grid.Auto.getRGB(action, Grid.Auto.Value.LED_GREEN))
                : e.green,
            blue:
              e.blue === "-1"
                ? String(Grid.Auto.getRGB(action, Grid.Auto.Value.LED_BLUE))
                : e.blue,
            alpha: e.alpha,
          }),
        ),
        layer: {
          value: String(parsed.layer),
          suggestions: [
            { value: "-1", info: "Auto" },
            ...getLayerSuggestions(element),
          ],
          validator: getValidator(String(parsed.layer)),
        },
        element: {
          value: parsed.element,
          suggestions: getElementSuggestions(page),
          validator: getValidator(parsed.element),
        },
        selectedIndex,
        pickerColor,
        alphaSliderValue,
        red: getColorData(red, Channel.RED),
        green: getColorData(green, Channel.GREEN),
        blue: getColorData(blue, Channel.BLUE),
        alpha: getColorData(alpha, Channel.ALPHA),
        updateIntensity,
      });

      const unsubscribe = event.subscribe(() => {
        this.update((s) => {
          ["red", "green", "blue", "alpha"].forEach((color) => {
            s[color].suggestions = getRGBASuggestions(action, toChannel(color));
          });
          return s;
        });
      });
      this.unsubscribers.push(unsubscribe);
    }

    public removeLayer(index: number) {
      this.update((s) => {
        if (typeof s.colors[index] === "undefined") {
          throw "Layer can not be removed: Unknown layer.";
        }

        s.colors = [...s.colors.slice(0, index), ...s.colors.slice(index + 1)];

        s.previewColors = [
          ...s.previewColors.slice(0, index),
          ...s.previewColors.slice(index + 1),
        ];
        this.selectLayer(Math.min(s.colors.length - 1, index));
        return s;
      });
    }

    public addLayer() {
      this.update((s) => {
        switch (s.colors.length) {
          case 1:
            s.colors = [structuredClone(s.colors.at(-1)), s.colors[0]];
            s.previewColors = [
              structuredClone(s.previewColors.at(-1)),
              s.previewColors[0],
            ];
            this.selectLayer(0);
            break;
          case 2:
            s.colors = [
              s.colors[0],
              structuredClone(s.colors.at(-1)),
              s.colors[1],
            ];
            s.previewColors = [
              s.previewColors[0],
              structuredClone(s.previewColors.at(-1)),
              s.previewColors[1],
            ];
            this.selectLayer(1);
            break;
          default:
            return s;
        }
        return s;
      });
    }

    public selectLayer(index: number) {
      this.update((s) => {
        s.selectedIndex = index;
        const { red, green, blue, alpha } = s.colors[index];
        s.alphaSliderValue = isNaN(parseFloat(alpha))
          ? undefined
          : parseFloat(alpha);

        s.pickerColor = [red, green, blue].some((e) => isNaN(parseInt(e)))
          ? undefined
          : new Color.RGB(
              parseInt(red),
              parseInt(green),
              parseInt(blue),
            ).toHSL();

        s.red.value = red;
        s.green.value = green;
        s.blue.value = blue;
        s.alpha.value = alpha;
        return s;
      });
    }

    public updateAlphaSliderValue(value: number) {
      this.update((s) => {
        s.alphaSliderValue = value;
        s.alpha.value = String(value);
        s.colors[s.selectedIndex].alpha = String(value);
        s.previewColors[s.selectedIndex].alpha = String(value);
        return s;
      });
    }

    public UpdateIntensityEnabledValue(value: boolean) {
      this.update((s) => {
        s.updateIntensity = value;
        return s;
      });
    }

    public updatePickerColor(color: Color.HSL) {
      this.update((s) => {
        const { r, g, b } = color.toRGB();
        s.pickerColor = color;
        s.red.value = String(r);
        s.green.value = String(g);
        s.blue.value = String(b);

        const current = s.colors[s.selectedIndex];
        s.colors[s.selectedIndex] = {
          red: String(r),
          green: String(g),
          blue: String(b),
          alpha: current.alpha,
        };

        s.previewColors[s.selectedIndex] = {
          red: String(r),
          green: String(g),
          blue: String(b),
          alpha: current.alpha,
        };
        return s;
      });
    }

    public updateRGBAChannelValue(
      action: GridAction,
      value: string,
      validationError: boolean,
      channel: Channel,
    ) {
      this.update((s) => {
        s[channel].validator.value = !validationError;
        switch (channel) {
          case SimpleColor.Channel.RED: {
            s.colors[s.selectedIndex].red = value;
            s.previewColors[s.selectedIndex].red =
              value === "-1"
                ? String(Grid.Auto.getRGB(action, Grid.Auto.Value.LED_RED))
                : value;
            s.red.value = value;
            break;
          }
          case SimpleColor.Channel.GREEN: {
            s.colors[s.selectedIndex].green = value;
            s.previewColors[s.selectedIndex].green =
              value === "-1"
                ? String(Grid.Auto.getRGB(action, Grid.Auto.Value.LED_GREEN))
                : value;
            s.green.value = value;
            break;
          }
          case SimpleColor.Channel.BLUE: {
            s.colors[s.selectedIndex].blue = value;
            s.previewColors[s.selectedIndex].blue =
              value === "-1"
                ? String(Grid.Auto.getRGB(action, Grid.Auto.Value.LED_BLUE))
                : value;
            s.blue.value = value;
            break;
          }
          case SimpleColor.Channel.ALPHA: {
            const alpha = parseFloat(value);
            s.alphaSliderValue = isNaN(alpha) ? 0 : alpha;
            s.colors[s.selectedIndex].alpha = value;
            s.previewColors[s.selectedIndex].alpha = value;
            s.alpha.value = value;
            break;
          }
        }

        const { red, green, blue } = s.previewColors[s.selectedIndex];
        s.pickerColor = [red, green, blue].some((e) => isNaN(parseInt(e)))
          ? undefined
          : new Color.RGB(
              parseInt(red),
              parseInt(green),
              parseInt(blue),
            ).toHSL();
        return s;
      });
    }
  }
}
