import { writable, derived, get } from 'svelte/store';

function create_commands(){

  const store = writable({
    GLOBALSTORE: {msg:'',valid:false},
    GLOBALRECALL:  {msg:'',valid:false},
    GLOBALCLEAR:  {msg:'',valid:false},
    LOCALSTORE:  {msg:'',valid:false},
    LOCALRECALL:  {msg:'',valid:false},
    LOCALCLEAR:  {msg:'',valid:false},
    response: {COMMAND: {'':''}}
  });

  return{
    ...store,
    start: (arg) => {

      let time = 1000;

      store.update(store => {store[arg].msg = 'wait'; return store;})
      
      if(arg.substr(arg.length - 5) == 'CLEAR') time = 10000;

      setTimeout(()=>{
        const res = get(store).response;
        if(res == undefined) { 
          store.update(store => store[arg].msg  = 'failure')
        };
      }, time)

    },
    response: (arg) => {
      let _key = '';
      for (const key in arg.COMMAND) {
        if (arg.COMMAND.hasOwnProperty(key)) {
          _key = key
        }
      }
      store.update(store => {store.response = arg; return store});
      setTimeout(()=>{ store.update(store => {store[_key].msg  = 'success'; return store})},1500)
    },
    validity: (string, bool) => {
      store.update(store => {
        store[string].valid = bool;
        return store;
      })
    },
  }
}

export const commands = create_commands();