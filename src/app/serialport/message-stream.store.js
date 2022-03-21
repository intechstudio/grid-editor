// Top level imports
import { writable, get } from 'svelte/store';
import { writeBuffer } from '../runtime/engine.store';
import { debug_store, runtime, user_input, update_elementPositionStore } from '../runtime/runtime.store';

import { debug_monitor_store } from '../main/panels/DebugMonitor/DebugMonitor.store';
import { midi_monitor_store } from '../main/panels/MidiMonitor/MidiMonitor.store';

function createMessageStream(){

  const _deliver_inbound = function(class_array) {

    if (class_array === undefined){
      return;
    }

    class_array.forEach((class_descr, i) => {

      if (class_descr.class_name === "HEARTBEAT"){
        // check if it is online and if not then create a new module

        runtime.incoming_heartbeat_handler(class_descr);
      }

      if (class_descr.class_name === "PAGECOUNT"){
  
        // update page count, now not used because it is constant 4      
      }

      if(class_descr.class_name === "DEBUGTEXT"){
        debug_monitor_store.update_debugtext(class_descr);
      }

      if(class_descr.class_name === "MIDI" || class_descr.class_name === "MIDISYSEX" ){
      
        midi_monitor_store.update_midi(class_descr);
      }      
      
      if(class_descr.class_name === "CONFIG"){
      
      }

      if (class_descr.class_name === "EVENT"){

        // update control element rotation
        update_elementPositionStore(class_descr);


        // update active element selection
        user_input.process_incoming_from_grid(class_descr);
      }

      if (class_descr.class_name === "PAGEACTIVE" &&  class_descr.class_instr === "EXECUTE"){
        runtime.change_page(class_descr.class_parameters.PAGENUMBER);
      }


      writeBuffer.validate_incoming(class_descr);

    });

    

  }

  return {
    deliver_inbound: _deliver_inbound
  }

}


export const messageStream = createMessageStream();
