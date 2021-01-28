import { readable, writable, derived, get } from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

import { parameter_parser } from '../settings/local/actions/action-helper';

import { serialComm } from '../core/serialport/serialport.store';

import { messageStore } from '../stores/message.store';

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
          { BANKNUMBER: parameter_parser(inputStore.bankActive)}, 
          { ELEMENTNUMBER: parameter_parser(inputStore.elementNumber)}, 
          { EVENTTYPE: parameter_parser(inputStore.eventType)}, 
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

  function getConfig(controller, inputStore){
    if(controller !== undefined && inputStore !== undefined){
      const fetch = runtime.fetchLocalConfig(controller, inputStore);
      serialComm.write(fetch);
    }
  }

  function sendConfig(config, controller, bankNumber, elementNumber, eventType){
    runtime.sendCfgToGrid(
      config, 
      {
        dx: controller.dx, 
        dy: controller.dy, 
        rot: controller.rot
      },
      bankNumber, 
      elementNumber,
      eventType
    );
  }

  function synchronize(){
    const grid = get(runtime);
    let changes = 0;
    let gate = 0;
    
    let num_of_fetched = 0;
    let num_of_received = 0;
    let num_of_sent_to_grid = 0;
    let num_of_changed = 0;
    grid.forEach((controller) => {
      controller.banks.forEach((bank, bankNumber) => {
        bank.forEach((controlElement, elementNumber) => {
          controlElement.events.forEach(event =>{

            if(event.cfgStatus == "fetched"){
              num_of_fetched++;
            }

            if(event.cfgStatus == "received"){
              num_of_received++;
            }

            if(event.cfgStatus == "sent_to_grid"){
              num_of_sent_to_grid++;
            }

            if(event.cfgStatus == "changed"){
              num_of_changed++;
            }


            if(event.cfgStatus == "expected" || event.cfgStatus == "fetched" && gate == 0){
              console.log(controller, event.cfgStatus)
              getConfig(controller, {bankActive: bankNumber, elementNumber: elementNumber, eventType: event.event.value});
              event.cfgStatus = "fetched";

              gate = 1
            }
            
         
            if(event.cfgStatus == "changed" && gate == 0){
              sendConfig(event.config, controller, bankNumber, elementNumber, event.event.value)
              event.cfgStatus = "sent_to_grid";
              gate = 1;
            }
     

          })
        })
      })
    })

    messageStore.fetched(num_of_fetched)
    messageStore.received(num_of_received)
    messageStore.changed(num_of_changed)
    messageStore.sent_to_grid(num_of_sent_to_grid)

    if(changes > 1){
      //messageStore.multipleChanges(changes);
    }
    if(changes == 0){
      //messageStore.reset();
    }
  }

  const interval = setInterval(() => {
    counter++;
    counter = counter % 100;
    set(counter);
    synchronize();
  }, 15);

  return function stop(){
    counter = 0;
    clearInterval(interval);
  }
});
