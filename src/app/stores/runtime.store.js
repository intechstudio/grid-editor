import { writable } from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

GRID_PROTOCOL.initialize();

function createRuntimeStore(){

  // provide a dummy grid controller module to this store
  const store = writable([]);

  return {
    ...store,
    actionToConfig: (action) => {
      const cfg = GRID_PROTOCOL.action_to_cfg(action.name, action.parameters);
      return cfg;
    },
    configsToActions: (cfgs) => {
      let actions = [];
      cfgs.forEach((cfg,i)=>{
        actions[i] = GRID_PROTOCOL.cfg_to_action(cfg);
      })
      return actions;
    },
    fetchLocalConfig: (controller, inputStore) => {
      const cfg = GRID_PROTOCOL.encode(
        { 
          dx: controller.dx, 
          dy: controller.dy,
          rot: controller.rot
        },
        "CONFIGURATION",
        "FETCH",
        [
          { BANKNUMBER: inputStore.bankActive}, 
          { ELEMENTNUMBER: inputStore.elementNumber}, 
          { EVENTTYPE: inputStore.eventType}, 
          { ACTIONSTRING: "" }
        ],
        ""
      );
      return cfg;
    },
    fetchGlobalConfig: (controller, bank) => {
      const cfg = GRID_PROTOCOL.encode(
        "",
        "GLOBALRECALL",
        "EXECUTE",
        [{BANKNUMBER: bank}],
        ""
      )
      return cfg;
    }
  }
}

export const runtime = createRuntimeStore();