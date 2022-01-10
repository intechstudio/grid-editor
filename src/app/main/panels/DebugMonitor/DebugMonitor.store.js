import { writable, get } from 'svelte/store';


function createDebugMonitor(){

  const store = writable([]);
  let freeze = false;

  return {
    ...store,
    freeze: ()=>{
      freeze = true
    },
    unfreeze: ()=>{
      freeze = false
    },
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


function createDebugOutbound(){

  const store = writable([]);
  let freeze = false;

  return {
    ...store,
    freeze: ()=>{
      freeze = true
    },
    unfreeze: ()=>{
      freeze = false
    },
    push: (arr) => {

      store.update(d => {
        if (freeze == false){

          if(d.length >= 15){
            d.shift()
          }
          d = [...d, arr];
        
        }
        return d;
      })
    }

  }
}

function createDebugLowlevel(){

  const store = writable([]);
  let freeze = false;

  return {
    ...store,
    freeze: ()=>{
      freeze = true
    },
    unfreeze: ()=>{
      freeze = false
    },
    push_inbound: (arr) => {

      store.update(d => {
        if (freeze == false){

          let obj = {}
          obj.data = arr;
          obj.direction = "IN";

          if(d.length >= 30){
            d.pop()
          }
          d = [obj, ...d];
        
        }
        return d;
      })
    },
    push_outbound: (arr) => {

      store.update(d => {
        if (freeze == false){

          let obj = {}
          obj.data = arr;
          obj.direction = "OUT";

          if(d.length >= 30){
            d.pop()
          }
          d = [obj, ...d];
        
        }
        return d;
      })
    }

  }
}


export const debug_monitor_store = createDebugMonitor();
export const debug_lowlevel_store = createDebugLowlevel();
