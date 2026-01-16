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
import { Validator } from "./validators";
import { LocalDefinitions } from "../runtime/runtime.store";
import { MeltComboData } from "@intechstudio/grid-uikit";

export namespace ResetEncoder {
  export class ParsedData {
    public rotationValue: string;
    public element: string;

    constructor(action: GridAction) {
      let actionstring = action.script;

      // Extract just the eva(...) call with balanced parens
      const evaIndex = actionstring.indexOf("eva(");
      if (evaIndex !== -1) {
        let depth = 0;
        let end = evaIndex;
        for (let i = evaIndex; i < actionstring.length; i++) {
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

      this.rotationValue = actionstring.match(/eva\(([^)]*)\)$/)[1];
      this.element = actionstring.match(/(.*?)eva/)[1].slice(0, -1);
    }
  }

  const rotationValueSuggestions = [
    { info: "Zero", value: "0" },
    { info: "Minimum", value: '"0%"' },
    { info: "Center", value: '"50%"' },
    { info: "Maximum", value: '"100%"' },
  ];

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

  function getLocalDefinitions(action: GridAction) {
    const event = action.parent as GridEvent;
    const actions = event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    return localDefinitions;
  }

  function getRotationValueSuggestions(action: GridAction) {
    return [...rotationValueSuggestions, ...getLocalDefinitions(action)];
  }

  export type ViewModelData = {
    rotationValue: MeltComboData;
    element: MeltComboData;
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

      const getValidator = (value: string) => ({
        value: new Validator(value).isLuaValue().Result(),
        func: (e: string) => new Validator(e).isLuaValue().Result(),
      });

      this.set({
        rotationValue: {
          value: String(parsed.rotationValue),
          suggestions: getRotationValueSuggestions(action),
          validator: getValidator(String(parsed.rotationValue)),
        },
        element: {
          value: parsed.element,
          suggestions: getElementSuggestions(page),
          validator: getValidator(parsed.element),
        },
      });

      const unsubscribe = event.subscribe(() => {
        this.update((s) => {
          s.rotationValue.suggestions = getRotationValueSuggestions(action);
          return s;
        });
      });
      this.unsubscribers.push(unsubscribe);
    }
  }
}
