import {
  writable,
  Writable,
  Subscriber,
  Unsubscriber,
  Updater,
  Readable,
  get,
} from "svelte/store";
import { type MeltComboData } from "@intechstudio/grid-uikit";
import { GridAction } from "../runtime/runtime";
import { Script } from "./_script_parsers";
import { Validator } from "./validators";

export namespace ForLoop {
  export class ParsedData {
    public variable: string;
    public increment: string;

    constructor(action: GridAction) {
      const script = action.script;
      let segments = Script.toSegments({ short: "", script: script });
      this.variable = segments[0];
      this.increment = segments[2];
    }
  }

  export type ViewModelData = {
    variable: MeltComboData;
    increment: MeltComboData;
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
      this.set({
        variable: {
          value: parsed.variable,
          validator: {
            value: true,
            func: (e) => new Validator(e).isLuaVariable().Result(),
          },
          suggestions: [
            { value: "i", info: "i" },
            { value: "j", info: "j" },
            { value: "k", info: "k" },
          ],
        },
        increment: {
          value: parsed.increment,
          validator: {
            value: true,
            func: (e) => new Validator(e).NotEmpty().Result(),
          },
          suggestions: [],
        },
      });
    }

    public buildScript() {
      const data = get(this._internal);
      return `for ${data.variable.value}=1,${data.increment.value} do`;
    }

    public isValidationError() {
      const data = get(this._internal);
      return (
        data.variable.validator.value === false ||
        data.increment.validator.value === false
      );
    }
  }
}
