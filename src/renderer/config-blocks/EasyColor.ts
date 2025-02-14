import {
  writable,
  Writable,
  Subscriber,
  Unsubscriber,
  Updater,
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

export namespace EasyColor {
  export class ColorData {
    constructor(
      public r: string,
      public g: string,
      public b: string,
      public a: string
    ) {}
    public toRGBA() {
      return new Grid.RGBA(
        Number(this.r),
        Number(this.g),
        Number(this.b),
        Number(this.a)
      );
    }
  }

  export class ParsedData {
    public colors: ColorData[];
    public layer: { value: string; suggestions: MeltComboSuggestion[] };
    public element: { value: string; suggestions: MeltComboSuggestion[] };
    public selectedLayer: number;

    constructor(action: GridAction) {
      const event = action.parent as GridEvent;
      const element = event.parent as GridElement;
      const page = element.parent as GridPage;

      const segments = Script.toSegments({
        short: `led_color`,
        script: action.script.split(":")[1],
      });
      this.colors = Grid.parseBracketValues(segments[1]).map((e) => {
        const values = Grid.parseBracketValues(e);
        return new ColorData(values[0], values[1], values[2], values[3]);
      });

      (this.layer = {
        value: String(segments[0]),
        suggestions: getLayerSuggestions(element),
      }),
        (this.element = {
          value: action.script.split(":")[0],
          suggestions: getElementSuggestions(page),
        });
      this.selectedLayer = this.colors.length - 1;
    }
  }

  export class ViewModel implements Writable<ParsedData> {
    protected _internal: Writable<ParsedData> = writable();

    constructor(action: GridAction) {
      this.set(new ParsedData(action));
    }

    public subscribe(
      run: Subscriber<ParsedData>,
      invalidate?: (value?: ParsedData) => void
    ): Unsubscriber {
      return this._internal.subscribe(run, invalidate);
    }

    public set(value: ParsedData) {
      this._internal.set(value);
    }

    public update(updater: Updater<ParsedData>) {
      this._internal.update(updater);
    }

    public removeLayer(index: number) {
      this.update((s) => {
        if (typeof s.colors[index] === "undefined") {
          throw "Layer can not be removed: Unknown layer.";
        }

        s.colors = [...s.colors.slice(0, index), ...s.colors.slice(index + 1)];
        s.selectedLayer = Math.min(s.colors.length - 1, index);
        return s;
      });
    }

    public addLayer(color: Grid.RGBA) {
      this.update((s) => {
        s.colors.push(
          new ColorData(
            String(color.r),
            String(color.g),
            String(color.b),
            String(color.a)
          )
        );
        return s;
      });
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
}
