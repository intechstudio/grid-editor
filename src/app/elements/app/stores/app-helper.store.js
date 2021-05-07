import {writable, get} from 'svelte/store';

import { runtime } from '../../runtime/runtime.store.js';

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

export const focusedCodeEditor = writable();

export const actionNodeBinding = writable([]);

export const advancedPrefStore = createAdvancedPrefStore();

export const dropStore = createDropStore();

export const actionPrefStore = createActionPrefStore();

export const actionIsDragged = writable(false);


