import { writable, get } from 'svelte/store';


function createDebugMonitor(){

  const store = writable([]);

  return {
    ...store,
    update_debugtext: (descr) => {

      let sx = descr.brc_parameters.SX;
      let sy = descr.brc_parameters.SY;
      let text = descr.class_parameters.TEXT;


      store.update(d => {
       
          if(d.length >= 15){
            d.shift()
          }
          d = [...d, `[${sy},${sx}] ${text}`];
        
        return d;
      })
    }

  }
}


export const debug_monitor_store = createDebugMonitor();
