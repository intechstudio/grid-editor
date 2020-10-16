import { writable } from 'svelte/store';
import * as grid_protocol from '../../external/grid-protocol/grid_protocol.json';

import { commands } from '../settings/shared/handshake.store.js';

const GRID = grid_protocol;

function createConfigStore(){

  const store = writable({valid: false});

  return {
    ...store,
    save: (index, module, event, element, config) => {
      store.update(store => {
        if(!store[module.id]) store[module.id] = {};
        if(!store[module.id][element.bank]) store[module.id][element.bank] = [];
        if(!store[module.id][element.bank][event.value]) store[module.id][element.bank][event.value] = [];
        store[module.id][element.bank][event.value][index] = config;
        // set validity for enabling or disabling commands
        commands.validity('LOCALSTORE', true);
        return store;
      })
    },    
    remove: (index, module, event, element) => {
      store.update(store => {
        console.log(store[module.id][element.bank][event.value]);
        store[module.id][element.bank][event.value].splice(index, 1)
        return store
      })
    }
  }
}

export const configStore = createConfigStore();