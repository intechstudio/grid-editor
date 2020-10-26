import { writable } from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

GRID_PROTOCOL.initialize();

function createRuntimeStore(){

  // provide a dummy grid controller module to this store
  const store = writable([]);

  return {
    ...store,
    actionsToConfig: (actions) => {
      let temp_cfgs = [];
      let cfgs = [];
      actions.forEach((action,index) => {
        temp_cfgs[index] = GRID_PROTOCOL.action_to_cfg(action.name, action.parameters);
      });
      temp_cfgs.map(a => {
        cfgs.push(...a)
      });
      return cfgs;
    },
    configToActions: (cfgs) => {
      let actions = GRID_PROTOCOL.cfgs_to_actions(cfgs);
      return actions;
    },
    fetchConfig: (controller, inputStore) => {
      const cfg = GRID_PROTOCOL.encode(
        { 
          DX: controller.dx, 
          DY: controller.dy,
          ROT: controller.rot
        },
        "CONFIGURATION",
        "FETCH",
        [
          { BANKNUMBER: inputStore.bankActive}, 
          { ELEMENTNUMBER: inputStore.elementNumber[0]}, 
          { EVENTTYPE: inputStore.eventType[0]}, 
          { ACTIONSTRING: "" }
        ],
        ""
      );
      return cfg;
    }
  }
}

export const runtime = createRuntimeStore();