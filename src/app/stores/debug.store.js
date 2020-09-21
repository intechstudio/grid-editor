import { writable, get } from 'svelte/store';

function createDebugStore(){
  const store = writable([]);

  const limit = 100;

  return {
    ...store,
    store: (array) => {
      let serial = get(store);
      if(serial.length >= limit){
        serial = serial.slice(1);
        serial[serial.length] = {type: 'input', data: array};
      } else {
        serial = [...serial, {type: 'input', data: array}]
      }
      store.update(s => {
        s = serial;
        return s;
      })
    }
  }
}

export const debugStore = createDebugStore();
