import { writable, get } from 'svelte/store';

import { debugStore } from '../stores/debug.store';

function createSerialComm(){
  const store = writable([]);

  return {
    ...store,
    write: (args) => { 
      debugStore.update(store => {
        store = [...store, {type: 'output', data: args} ]
        return store;
      })
      const port = get(store)[0];
      port.write(`${args}\n`);
      return
    }
  }
}

export const serialComm = createSerialComm();

 