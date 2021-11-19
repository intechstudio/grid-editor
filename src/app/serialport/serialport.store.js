import { writable, get } from 'svelte/store';

function createSerialComm(){
  const store = writable({
    list: [],
    open: undefined,
    selected: '',
    isEnabled: false
  });


  return {
    ...store,
    enabled: (bool) => {
      store.update(store => {store.isEnabled = bool; return store;});
    },
    write: (args) => { 
      if(get(store).isEnabled){

        let port = get(store).open;
        
        try {
          if(typeof args == 'object')
            port.write([...args, 10]);
          else
            port.write(args+'\n');
        } catch (error) {
          console.error('Serial write error', error)
        }
        
      }
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

export const commIndicator = createCommIndicator();

function createCommIndicator(){

  const { subscribe, update } = writable({tx: 0, rx: 0});

	return {
		subscribe,
		tick: (direction) => {
      update(t => { t[direction] = 1; return t})
      setTimeout(()=>{
        update(t => { t[direction] = 0; return t })
      },100)
    }
	}
}



 