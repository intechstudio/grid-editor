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



export let inbound_data_rate_points = writable("")
export let outbound_data_rate_points = writable("")


export const inbound_data_rate_history = writable([]);  
export const outbound_data_rate_history = writable([]);

function createDebugLowlevel(){

  const store = writable([]);
  let freeze = false;
  let inbound_data_rate = 0
  let outbound_data_rate = 0

  let graph_interval = 500

  const graph_step = function(){

    let in_rate_kbps = inbound_data_rate/graph_interval
    let out_rate_kbps = outbound_data_rate/graph_interval
    inbound_data_rate=0
    outbound_data_rate=0

    inbound_data_rate_history.update(d => {

      if(d.length >= 30){
        d.shift()
      }
      d = [...d, in_rate_kbps];

      let inbound = ""
      for(let i=0; i<d.length; i++){
        inbound += (i*3).toString()+"," + (50-d[i]*2).toString() + " "
      }

      inbound_data_rate_points.update(d => {
        d = inbound;
        return d;
      })

      
      return d;
    })
    outbound_data_rate_history.update(d => {

      if(d.length >= 30){
        d.shift()
      }
      d = [...d, out_rate_kbps];

      let outbound = ""
      for(let i=0; i<d.length; i++){
        outbound += (i*3).toString()+"," + (50-d[i]*2).toString() + " "
      }

      outbound_data_rate_points.update(d => {
        d = outbound;
        return d;
      })


      return d;
    })

    setTimeout(() => {
      graph_step()
    }, graph_interval);

  }

  graph_step()

  return {
    ...store,
    freeze: ()=>{
      freeze = true
    },
    unfreeze: ()=>{
      freeze = false
    },
    push_inbound: (arr) => {

      inbound_data_rate += arr.length
      store.update(d => {
        if (freeze == false){

          let obj = {}
          obj.data = arr;
          obj.direction = "IN";

          if(d.length >= 15){
            d.pop()
          }
          d = [obj, ...d];
        
        }
        return d;
      })
    },
    push_outbound: (arr) => {
      outbound_data_rate += arr.length

      store.update(d => {
        if (freeze == false){

          let obj = {}
          obj.data = arr;
          obj.direction = "OUT";

          if(d.length >= 15){
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
