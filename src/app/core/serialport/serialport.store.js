import { writable, get } from 'svelte/store';

function createSerialComm(){
  const store = writable({
    list: [],
    open: undefined,
    selected: ''
  });

  function addToCommDebug(args){
    serialCommDebug.update(store => {
      let output = args;
      if(typeof output == 'object'){
        output = args.map(arg => {
          return String.fromCharCode(arg)
        });
        output = output.join('');
      }
      store = [...store, {type: 'output', data: output} ]
      return store;
    })
  }

  return {
    ...store,
    write: (args) => { 

      addToCommDebug(args);

      let port = get(store).open;
      
      if(typeof args == 'object')
        port.write([...args, 10]);
      else
        port.write(args+'\n');

      return;
    },
    selected: (port) => {
      store.update(store => {
        store.selected = port;
        return store;
      });
      return;
    },
    open: (port) => {
      store.update(store=>{
        store.open = port;
        return store;
      })
      return;
    }
  }
}

export const serialComm = createSerialComm();

function createSerialCommDebug(){
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

export const serialCommDebug = createSerialCommDebug();


 