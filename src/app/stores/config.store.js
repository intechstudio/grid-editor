import { writable } from 'svelte/store';
import * as grid_protocol from '../../external/grid-protocol/grid_protocol.json';
import { blank_object } from 'svelte/internal';

const GRID = grid_protocol;

function createConfigStore(){
  const store = writable({});

  function serialize(actions){
    console.log(actions);
  }

  return {
    ...store,
    save: (index,module, event, element, config) => {
      store.update(store => {
        if(!store[module.id]) store[module.id] = {};
        if(!store[module.id][element.bank]) store[module.id][element.bank] = [];
        if(!store[module.id][element.bank][event.value]) store[module.id][element.bank][event.value] = [];
        store[module.id][element.bank][event.value][index] = config;
        // store[module.id][element.bank][event.value][index] = {element, config}
        serialize(store[module.id][element.bank][event.value]);
        return store;
      })
    },    
  }
}

export const configStore = createConfigStore();