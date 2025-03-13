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

export namespace SimpleColor {
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
        short: `led_color`,
        script: action.script.split(":")[1],
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
        })
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

  class ViewModelData {
    constructor(
      public colors: Array<{
        red: string;
        green: string;
        blue: string;
        alpha: string;
      }>,
      public layer: { value: string; suggestions: MeltComboSuggestion[] },
      public element: { value: string; suggestions: MeltComboSuggestion[] },
      public selectedIndex: number
    ) {}

    public getSelectedColor() {
      return this.colors[this.selectedIndex];
    }

    public getSelectedIndex() {
      return this.selectedIndex;
    }
  }

  export class ViewModel implements Readable<ViewModelData> {
    protected _internal: Writable<ViewModelData> = writable();

    constructor(action: GridAction) {
      const parsed = new ParsedData(action);
      const event = action.parent as GridEvent;
      const element = event.parent as GridElement;
      const page = element.parent as GridPage;

      this.set(
        new ViewModelData(
          (parsed.colors = parsed.colors),
          {
            value: String(parsed.element),
            suggestions: getLayerSuggestions(element),
          },
          {
            value: parsed.element,
            suggestions: getElementSuggestions(page),
          },
          parsed.colors.length - 1
        )
      );
    }

    public subscribe(
      run: Subscriber<ViewModelData>,
      invalidate?: (value?: ViewModelData) => void
    ): Unsubscriber {
      return this._internal.subscribe(run, invalidate);
    }

    private set(value: ViewModelData) {
      this._internal.set(value);
    }

    private update(updater: Updater<ViewModelData>) {
      this._internal.update(updater);
    }

    public updateData(data: ParsedData) {
      this.update((s) => {
        s.colors = data.colors;
        s.layer.value = String(data.layer);
        s.element.value = data.element;
        return s;
      });
    }

    public removeLayer(index: number) {
      this.update((s) => {
        if (typeof s.colors[index] === "undefined") {
          throw "Layer can not be removed: Unknown layer.";
        }

        s.colors = [...s.colors.slice(0, index), ...s.colors.slice(index + 1)];
        s.selectedIndex = Math.min(s.colors.length - 1, index);
        return s;
      });
    }

    public addLayer(color: {
      red: string;
      green: string;
      blue: string;
      alpha: string;
    }) {
      this.update((s) => {
        switch (s.colors.length) {
          case 1:
            s.colors = [structuredClone(color), s.colors[0]];
            s.selectedIndex = 0;
            break;
          case 2:
            s.colors = [s.colors[0], structuredClone(color), s.colors[1]];
            s.selectedIndex = 1;
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
        return s;
      });
    }

    public updateSelectedLayer(color: {
      red: string;
      green: string;
      blue: string;
      alpha: string;
    }) {
      this.update((s) => {
        s.colors[s.selectedIndex] = color;
        return s;
      });
    }
  }
}
