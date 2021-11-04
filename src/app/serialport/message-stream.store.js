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
        runtime.device.is_online(grid.device.make(class_descr.brc_parameters, class_descr.class_parameters, false));
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

        // update active element selection
        user_input.process_incoming_from_grid(class_descr);

        // update control element rotation
        user_input.update_eventparam(class_descr);  

      }

    });


    // enable user input from grid only if engine is enabled
    if(get(engine) == 'ENABLED'){
      
      // if(DATA.EVENT){ // event class
      //   // enable event tracking only, if changeOnContact is enabled and event is NOT timer!
      //   // filter midi rx and timer!
      //   if(get(appSettings).changeOnContact && DATA.EVENT[0].EVENTTYPE != 6 && DATA.EVENT[0].EVENTTYPE != 5){
      //     user_input.process_incoming_from_grid({brc: DATA.BRC, event: DATA.EVENT[0]}); // only one element should be set as target ui
      //   }
      // }

      if(DATA.PAGEACTIVE){
        user_input.update_pagenumber.pagenumber(DATA.PAGEACTIVE.PAGENUMBER);
      }
    }


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
