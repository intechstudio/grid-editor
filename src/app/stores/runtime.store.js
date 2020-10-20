import { writable } from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

function createRuntimeStore(){

  // provide a dummy grid controller module to this store
  const store = writable([]);

  return {
    ...store,
    actionToConfig: () => {

    },
    configToAction: () => {

    },
    fetchConfig: (controller, inputStore) => {
      const cfg = GRID_PROTOCOL.encode(
        { 
          id: controller.id, 
          dx: controller.dx, 
          dy: controller.dy 
        },
        "CONFIGURATION",
        "FETCH",
        { 
          BANKNUMBER: inputStore.bankActive, 
          ELEMENTNUMBER: inputStore.elementNumber, 
          EVENTTYPE: inputStore.eventType, 
          ACTIONSTRING: "" 
        },
        ""
      );

      return cfg;
    }
  }
}

export const runtime = createRuntimeStore();