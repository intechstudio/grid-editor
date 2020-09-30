import { writable } from 'svelte/store';
import * as grid_protocol from '../../external/grid-protocol/grid_protocol.json';

const GRID = grid_protocol;

function createConfigStore(){
  const store = writable({});

  return {
    ...store,
    save: (index, module, event, element, config) => {
      store.update(store => {
        if(!store[module.id]) store[module.id] = {};
        if(!store[module.id][element.bank]) store[module.id][element.bank] = [];
        if(!store[module.id][element.bank][event.value]) store[module.id][element.bank][event.value] = [];
        store[module.id][element.bank][event.value][index] = config;
        return store;
      })
    },    
  }
}

export const configStore = createConfigStore();