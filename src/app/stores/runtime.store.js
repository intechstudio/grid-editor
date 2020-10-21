import { writable } from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

GRID_PROTOCOL.initialize();

function lookupEventClass(className){

  const eventClasses = {
    "MIDI Dynamic": "MIDIRELATIVE",
    "MIDI Static": "MIDIABSOLUTE",
    "LED Color": "LEDCOLOR",
    "LED Phase": "LEDPHASE",
    "RAW": "RAW"
  }

  return eventClasses[className];
}

function createRuntimeStore(){

  // provide a dummy grid controller module to this store
  const store = writable([]);

  return {
    ...store,
    actionsToConfig: (actions) => {
      let cfgs = "";
      actions.forEach((action,index) => {
        const eventClass = lookupEventClass(action.name)
        cfgs += GRID_PROTOCOL.action_to_cfg(eventClass, action.parameters);
      });
      return cfgs;
    },
    configToActions: (cfg) => {
      const actions = GRID_PROTOCOL.decode_config();
      return actions;
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