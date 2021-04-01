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

export const advancedPrefStore = createAdvancedPrefStore();

export const actionPrefStore = createActionPrefStore();

// THIS SHOULDNT BE HERE, TESTING PURPOSE ONLY!

export const selectedControlElement = writable('encoder');