// Top level imports
import { writable, get } from 'svelte/store';
import { appSettings } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import { writeBuffer } from '../runtime/engine.store';
import { debug_store, runtime, user_input, logger, engine, midi_monitor_store } from '../runtime/runtime.store';

function createMessageStream(){

  const _message_stream = writable({});

  const _on_data = function(DATA) {

    let class_array = DATA.class_array;

    class_array.forEach((class_descr, i) => {
      
      //console.log(class_descr);

      if (class_descr.class_name === "HEARTBEAT"){
        // check if it is online and if not then create a new module
        runtime.device.is_online(class_descr, grid.device.make(class_descr.brc_parameters, class_descr.class_parameters, false));
      }

      if (class_descr.class_name === "PAGECOUNT"){
  
        runtime.device.update_pages(class_descr);        
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

    });

    if(DATA.LOG){
      logger.set(DATA.LOG);
    }

    
    writeBuffer.validate_incoming(DATA);

    
    _message_stream.set(DATA);

  }

  return {
    set: _on_data
  }

}


export const messageStream = createMessageStream();
