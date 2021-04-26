import {writable, get} from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

import { parameter_parser } from '../settings/local/actions/action-helper';

import { serialComm } from '../core/serialport/serialport.store';

function createActionPrefStore(){

  const store = writable({
    advanced: {
      index: undefined, 
      visible: false,
    },
  });

  return {
    ...store,
    showAdvanced: (index, bool) => {
      store.update(s => {s.advanced = {index: index, visible: bool}; return s});
    }
  }
}

function createAdvancedPrefStore(){
  const store = writable({
    index:-1
  });

  return{
    ...store,
    setIndex: (i) => {
      store.update(s => {s.index = i; return s;})
    }
  }
}

function createRuntimeStore(){
  const store = writable([])

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

function createDropStore(){

  const store = writable({
    disabledDropZones: []
  });

  return {
    ...store,
    disabledDropZones: (actions) => {
      let disabled_blocks = [];
      let if_block = false;
      actions.forEach(a => {

        // check if it's and if block
        if(a.component == 'IF'){
          if_block = true;
        }

        if(if_block){
          disabled_blocks.push(a.id);
        }
        
        // this is the last, as END has to be disabled too!
        if (a.component == 'END'){
          if_block = false;
        }

      });
      store.update(s => {s.disabledDropZones = disabled_blocks;return s;})
    }
  }
}

export const dropStore = createDropStore();

export const advancedPrefStore = createAdvancedPrefStore();

export const actionIsDragged = writable(false);

export const actionPrefStore = createActionPrefStore();

// THIS SHOULDNT BE HERE, TESTING PURPOSE ONLY!

export const selectedControlElement = writable('encoder');

export const runtime = createRuntimeStore();