import { writable, get, derived } from 'svelte/store';

import { runtime } from '../../runtime/runtime.store.js';

function createDropStore(){

  const store = writable({
    disabledDropZones: []
  });

  return {
    ...store,
    disabledDropZones: () => {
      const configs = get(runtime);
      let disabled_blocks = [];
      let if_block = false;
      configs.forEach((a,index) => {
        console.log(a, a.component.name, index)
        // check if it's and if block
        if(a.component.name == 'If'){
          if_block = true;
        }

        // don't add +1 id in the array (end)
        if(if_block && a.component.name !== 'End'){
          disabled_blocks.push(index);
        }
        
        // this is the last, as END has to be disabled too!
        if (a.component.name == 'End'){
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

export const configNodeBinding = writable([]);

export const advancedPrefStore = createAdvancedPrefStore();

export const actionPrefStore = createActionPrefStore();

export const actionIsDragged = writable(false);




