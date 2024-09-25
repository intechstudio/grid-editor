import { get, writable, type Writable } from "svelte/store";

import {
  runtime,
  user_input,
  UserInputValue,
} from "../../../runtime/runtime.store";
import { init_config_block_library } from "../../../lib/_configs";
import { GridAction } from "../../../runtime/runtime";

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

type ConfigManager = Writable<GridAction[]> & {
  refresh: () => void;
};

export const configManager = create_configuration_manager();

function create_configuration_manager(): ConfigManager {
  const internal = writable([]);
  const loadAndInit = async () => {
    await init_config_block_library();
    user_input.subscribe((ui) => {
      createConfigListFrom(ui)
        .then((list) => {
          internal.set(list);
        })
        .catch((e) => {
          console.warn(e);
          internal.set([]);
        });
    });
  };

  loadAndInit();

  function createConfigListFrom(ui: UserInputValue): Promise<GridAction[]> {
    return new Promise((resolve, reject) => {
      const event = runtime
        .getModule(ui.dx, ui.dy)
        .getPage(ui.pagenumber)
        .getElement(ui.elementnumber)
        .getEvent(ui.eventtype);

      event
        .load()
        .then((list) => {
          resolve(list);
        })
        .catch((e) => {
          console.log(e);
          reject(e);
        });
    });
  }

  async function refresh(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ui = get(user_input);
      createConfigListFrom(ui)
        .then((list) => {
          configManager.set(list);
          resolve();
        })
        .catch((e) => reject(e));
    });
  }

  return {
    ...internal,
    refresh: refresh,
  };
}
