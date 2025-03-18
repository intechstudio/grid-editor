import {
  writable,
  Writable,
  Subscriber,
  Unsubscriber,
  Updater,
  Readable,
} from "svelte/store";
import { Grid } from "../lib/_utils";
import {
  GridAction,
  GridElement,
  GridEvent,
  GridPage,
} from "../runtime/runtime";
import { Script } from "./_script_parsers";
import { ElementType } from "@intechstudio/grid-protocol";
import { MeltComboSuggestion } from "@intechstudio/grid-uikit";
import { Validator } from "./validators";
import { LocalDefinitions } from "../runtime/runtime.store";

export namespace SimpleColor {
  export enum Channel {
    RED = "red",
    GREEN = "green",
    BLUE = "blue",
    ALPHA = "alpha",
  }

  export type Color = {
    red: string;
    green: string;
    blue: string;
    alpha: string;
  };

  type MeltComboData = {
    value: string;
    suggestions: MeltComboSuggestion[];
    validator: {
      value: boolean;
      func: (e: string) => boolean;
    };
  };

  export class ParsedData {
    public colors: Array<{
      red: string;
      green: string;
      blue: string;
      alpha: string;
    }>;
    public layer: number;
    public element: string;

    constructor(action: GridAction) {
      const segments = Script.toSegments({
        short: `glc`,
        script: action.script.split(":").slice(1).join(":"),
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

      this.layer = Number(segments[0]);
      this.element = action.script.split(":")[0];
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
    switch (element.type) {
      case ElementType.BUTTON:
        return [
          { value: "1", info: "Button layer" },
          { value: "2", info: "Unused layer" },
        ];
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
    }
  }

  function getRGBASuggestions(action: GridAction) {
    const event = action.parent as GridEvent;
    const actions = event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    return localDefinitions;
  }

  export type ViewModelData = {
    previewColors: Array<Color>;
    layer: MeltComboData;
    element: MeltComboData;
    selectedIndex: number;
    pickerColor: Grid.HSL | undefined;
    alphaSliderValue: number | undefined;
    red: MeltComboData;
    green: MeltComboData;
    blue: MeltComboData;
    alpha: MeltComboData;
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
      const { red, green, blue, alpha } = parsed.colors[selectedIndex];
      const pickerColor = [red, green, blue].some((e) => isNaN(parseFloat(e)))
        ? undefined
        : new Grid.RGB(parseInt(red), parseInt(green), parseInt(blue)).toHSL();
      const alphaSliderValue = isNaN(parseFloat(alpha))
        ? undefined
        : parseFloat(alpha);
      const getValidator = (value: string) => ({
        value: new Validator(value).isLuaValue().Result(),
        func: (e: string) => new Validator(e).isLuaValue().Result(),
      });

      const getColorData = (value: string) => ({
        value,
        suggestions: getRGBASuggestions(action),
        validator: getValidator(value),
      });

      this.set({
        previewColors: parsed.colors,
        layer: {
          value: String(parsed.layer),
          suggestions: getLayerSuggestions(element),
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
        red: getColorData(red),
        green: getColorData(green),
        blue: getColorData(blue),
        alpha: getColorData(alpha),
      });

      const unsubscribe = event.subscribe(() => {
        this.update((s) => {
          ["red", "green", "blue", "alpha"].forEach((color) => {
            s[color].suggestions = getRGBASuggestions(action);
          });
          return s;
        });
      });
      this.unsubscribers.push(unsubscribe);
    }

    public removeLayer(index: number) {
      this.update((s) => {
        if (typeof s.previewColors[index] === "undefined") {
          throw "Layer can not be removed: Unknown layer.";
        }

        s.previewColors = [
          ...s.previewColors.slice(0, index),
          ...s.previewColors.slice(index + 1),
        ];
        this.selectLayer(Math.min(s.previewColors.length - 1, index));
        return s;
      });
    }

    public addLayer(color: Color) {
      this.update((s) => {
        switch (s.previewColors.length) {
          case 1:
            s.previewColors = [structuredClone(color), s.previewColors[0]];
            this.selectLayer(0);
            break;
          case 2:
            s.previewColors = [
              s.previewColors[0],
              structuredClone(color),
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
        const { red, green, blue, alpha } = s.previewColors[index];
        s.alphaSliderValue = isNaN(parseFloat(alpha))
          ? undefined
          : parseFloat(alpha);

        s.pickerColor = [red, green, blue].some((e) => isNaN(parseInt(e)))
          ? undefined
          : new Grid.RGB(
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
        const current = s.previewColors[s.selectedIndex];
        s.previewColors[s.selectedIndex] = {
          red: current.red,
          green: current.green,
          blue: current.blue,
          alpha: String(value),
        };
        return s;
      });
    }

    public updatePickerColor(color: Grid.HSL) {
      this.update((s) => {
        const { r, g, b } = color.toRGB();
        s.pickerColor = color;
        s.red.value = String(r);
        s.green.value = String(g);
        s.blue.value = String(b);

        const current = s.previewColors[s.selectedIndex];
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
      value: string,
      validationError: boolean,
      channel: Channel,
    ) {
      this.update((s) => {
        s[channel].validator.value = !validationError;
        switch (channel) {
          case SimpleColor.Channel.RED: {
            s.previewColors[s.selectedIndex].red = value;
            break;
          }
          case SimpleColor.Channel.GREEN: {
            s.previewColors[s.selectedIndex].green = value;
            break;
          }
          case SimpleColor.Channel.BLUE: {
            s.previewColors[s.selectedIndex].blue = value;
            break;
          }
          case SimpleColor.Channel.ALPHA: {
            const alpha = parseFloat(value);
            s.alphaSliderValue = isNaN(alpha) ? undefined : alpha;
            s.previewColors[s.selectedIndex].alpha = value;
            break;
          }
        }
        const { red, green, blue } = s.previewColors[s.selectedIndex];
        s.pickerColor = [red, green, blue].some((e) => isNaN(parseInt(e)))
          ? undefined
          : new Grid.RGB(
              parseInt(red),
              parseInt(green),
              parseInt(blue),
            ).toHSL();
        return s;
      });
    }
  }
}
