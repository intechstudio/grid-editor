import {writable} from 'svelte/store';

function createActionPrefStore(){

  const store = writable({
    advanced: {
      index: undefined, 
      visible: false
    }
  });

  return {
    ...store,
    showAdvanced: (index, bool) => {
      store.update(s => {s.advanced = {index: index, visible: bool}; return s});
    }
  }
}

export const actionPrefStore = createActionPrefStore();