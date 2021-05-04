import {writable, get, derived} from 'svelte/store';

import { GRID_PROTOCOL } from '../core/classes/GridProtocol';

import { parameter_parser } from '../settings/local/actions/action-helper';

import { serialComm } from '../core/serialport/serialport.store';

function createActionPrefStore(){

  const store = writable({
    advanced: {
      index: undefined, 
      visible: false,
    }
  });

  return {
    ...store,
    showAdvanced: (index, outside) => {
      store.update(s => {
        s.advanced = {
          index: index, 
          visible: !s.advanced.visible
        }
        return s
      });
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
    disabledDropZones: () => {
      const actions = get(runtime);
      let disabled_blocks = [];
      let if_block = false;
      actions.forEach((a,index) => {

        // check if it's and if block
        if(a.component == 'IF'){
          if_block = true;
        }

        // don't add +1 id in the array (end)
        if(if_block && a.component !== 'END'){
          disabled_blocks.push(index);
        }
        
        // this is the last, as END has to be disabled too!
        if (a.component == 'END'){
          if_block = false;
        }

      });

      //disabled_blocks.sort((a, b)=>a-b)

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

export const appMultiSelect = writable({multiselect: false, selection: []});

export const appActionClipboard = writable();

export const focusedCodeEditor = writable();

function createAppActionManagement(){
  const store = writable();

  function genUniqueIds(actions){

    let _temp_actions = [];
    actions.forEach((a,i) => {
      let _a = Object.assign({}, a); // need to mutate, else it wont be changed.
      _a.id = i;
      console.log(_a.id);
      _temp_actions.push(_a)
    });
    console.log(_temp_actions);
    return _temp_actions;
  }
  
  return {
    ...store,
    copy: () => {

      const actions = get(runtime);
      const selection = get(appMultiSelect).selection;

      console.log(selection);

      let clipboard = [];
      selection.forEach((elem,index) => {
        if(elem){
          clipboard.push(actions[index]);
        }
      });

      appActionClipboard.set(clipboard);
      console.log(clipboard);
    },

    paste: (index) => {

      const clipboard = get(appActionClipboard);
      let actions = get(runtime);
      actions.splice(index, 0, ...clipboard);      
      actions = genUniqueIds(actions);
      runtime.set(actions);
    },

    remove: (array) => {
      let actions = get(runtime);
      array.forEach(elem => {
        actions = actions.filter(a => a.id !== Number(elem));
      });
      actions = genUniqueIds(actions);
      runtime.set(actions);
    }
  }
}

export const localDefinitions = derived(runtime, $runtime => {
  let locals = [];
  $runtime.forEach(a => {
    if(a.code == 'locals'){
      // THIS IS A DUPLICATE, USED IN LOCALS TOO!
      let arr = [];
      const text = a.script.split('local');
      text.forEach(element => {
        if(element !== ''){
          const _split = element.split('=');
          arr.push({value: element, info: _split[0].trim()});
        }
      });
      locals.push(...arr);
    }
  });
  return locals;
})

export const actionNodeBinding = writable([]);

export const appActionManagement = createAppActionManagement();


