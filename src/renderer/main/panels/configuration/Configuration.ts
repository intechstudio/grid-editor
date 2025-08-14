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

export let lastOpenedActionblocks = writable([]);

export function lastOpenedActionblocksInsert(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set([
    ...currentList.filter((e) => e !== short),
    short,
  ]);
}

export function lastOpenedActionblocksRemove(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set(currentList.filter((e) => e !== short));
}

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
