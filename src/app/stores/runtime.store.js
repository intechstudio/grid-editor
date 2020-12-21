import { readable, writable, derived, get } from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

import { parameter_parser } from '../settings/local/actions/action-helper';

import { serialComm } from '../core/serialport/serialport.store';

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
    },
    sendCfgToGrid: (config, moduleInfo, bankNumber, elementNumber, eventType) => {
      const params = [
        { BANKNUMBER: parameter_parser(bankNumber) },
        { ELEMENTNUMBER: parameter_parser(elementNumber) },
        { EVENTTYPE: parameter_parser(eventType) }
      ]
      
      let array = [];
      config.forEach(a => {
        array.push(...a);
      });
  
      const serialized = GRID_PROTOCOL.serialize_cfgs(params, array);
      serialComm.write(GRID_PROTOCOL.encode(moduleInfo,'','','',serialized));
    }
  }
}

export const runtime = createRuntimeStore();

let counter = 0;
export const gridSyncProcess = readable(counter, function start(set){

  function synchronize(){
    const grid = get(runtime);
    let kva = 0;
    grid.forEach((controller) => {
      controller.banks.forEach((bank, bankNumber) => {
        bank.forEach((controlElement, elementNumber) => {
          controlElement.events.forEach(event =>{
            if(event.cfgStatus == "changed" && kva == 0){
              runtime.sendCfgToGrid(
                event.config, 
                {
                  dx: controller.dx, 
                  dy: controller.dy, 
                  rot: controller.rot
                },
                bankNumber, 
                elementNumber,
                event.event.value
              );
              event.cfgStatus = "sent_to_grid";
              kva = 1
            }
   
          })
        })
      })
    })
  }

  const interval = setInterval(() => {
    counter++;
    counter = counter % 100;
    set(counter);
    synchronize();
  }, 30);

  return function stop(){
    counter = 0;
    clearInterval(interval);
  }
});
