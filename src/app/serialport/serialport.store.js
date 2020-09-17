import { writable, get } from 'svelte/store';

function createSerialComm(){
  const store = writable([]);

  return {
    ...store,
    write: (args) => { 
      const port = get(store)[0];
      port.write(`${args}\n`);
      return
    }
  }
}

export const serialComm = createSerialComm();

 