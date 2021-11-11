// Top level imports
import { writable, get } from 'svelte/store';
import { writeBuffer } from '../runtime/engine.store';
import { debug_store, runtime, user_input, logger, engine, midi_monitor_store } from '../runtime/runtime.store';



function createMessageStream(){

  const _deliver_inbound = function(DATA) {

    let class_array = DATA.class_array;

    class_array.forEach((class_descr, i) => {

      if (class_descr.class_name === "HEARTBEAT"){
        // check if it is online and if not then create a new module

        runtime.device.heartbeat_incoming_handler(class_descr);
      }

      if (class_descr.class_name === "PAGECOUNT"){
  
        // update page count, now not used because it is constant 4      
      }

      if(class_descr.class_name === "DEBUGTEXT"){
        debug_store.update_debugtext(class_descr);
      }

      if(class_descr.class_name === "MIDI"){
      
        midi_monitor_store.update_midi(class_descr);
      }

      if (class_descr.class_name === "EVENT"){

        // update control element rotation
        user_input.update_eventparam(class_descr);  

        // update active element selection
        user_input.process_incoming_from_grid(class_descr);
      }

      if (class_descr.class_name === "PAGEACTIVE"){

        user_input.update_pagenumber.pagenumber(class_descr.class_parameters.PAGENUMBER);
      }


      writeBuffer.validate_incoming(class_descr);

    });

    

  }

  return {
    deliver_inbound: _deliver_inbound
  }

}


export const messageStream = createMessageStream();
