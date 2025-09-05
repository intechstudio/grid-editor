import {
  get,
  Readable,
  Subscriber,
  Unsubscriber,
  Updater,
  Writable,
  writable,
} from "svelte/store";

import { logger } from "../../../runtime/runtime.store";
import { lua_error_store } from "../DebugMonitor/DebugMonitor.store";
import { GridAction, GridElement } from "../../../runtime/runtime";
import { EventType, NumberToEventType } from "@intechstudio/grid-protocol";

class ToggledBlocks implements Readable<string[]> {
  protected internal: Writable<string[]>;
  protected unsubscribers: Unsubscriber[] = [];

  constructor(value: string[]) {
    this.internal = writable(value);
  }

  public subscribe(
    run: Subscriber<string[]>,
    invalidate?: (value?: string[]) => void,
  ): Unsubscriber {
    return this.internal.subscribe(run, invalidate);
  }

  private set(value: string[]) {
    this.internal.set(value);
  }

  private update(updater: Updater<string[]>) {
    this.internal.update(updater);
  }

  public add(value: string) {
    if (get(this.internal).includes(value)) {
      return;
    }

    this.update((s) => [...s, value]);
  }

  public remove(value: string) {
    this.update((s) => {
      const index = s.indexOf(value);
      if (index > -1) {
        s.splice(index, 1);
      }
      return s;
    });
    return value;
  }

  public includes(value: string) {
    return get(this.internal).includes(value);
  }
}

export const toggledBlocks = new ToggledBlocks([]);

//Lua Error handling and display
lua_error_store.subscribe((store) => {
  const error = store.slice(-1).pop();
  if (typeof error === "undefined") {
    return;
  }

  switch (error.type) {
    case "luanotok":
      logger.set({
        type: "alert",
        mode: 0,
        classname: "luanotok",
        message: `${error.device}: Error on Element ${error.element.no} ${error.event.type} event.`,
      });
      break;
    case "kbisdisabled":
      logger.set({
        type: "alert",
        mode: 0,
        classname: "kbisdisabled",
        message: `${error.device}: Keyboard events are disabled until storing.`,
      });
      break;
  }
});
