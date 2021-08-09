// Top level imports
import { writable, get } from 'svelte/store';
import { appSettings } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import { writeBuffer } from '../runtime/engine.store';
import { debug_store, runtime, user_input, logger, engine, midi_monitor_store } from '../runtime/runtime.store';

function createMessageStream(){

  const _message_stream = writable({});

  const _on_data = function(DATA) {

    if(DATA.HEARTBEAT){
      runtime.device.is_online(grid.device.make(DATA.BRC, DATA.HEARTBEAT, false));
    }

    if(DATA.PAGECOUNT){
      runtime.device.update_pages({brc: DATA.BRC, pagenumber: DATA.PAGECOUNT.PAGENUMBER})
    }

    // enable user input from grid only if engine is enabled
    if(get(engine) == 'ENABLED'){
      if(DATA.EVENT){
        if(get(appSettings).changeOnContact){
          user_input.grid_process_incoming({brc: DATA.BRC, event: DATA.EVENT[0]}); // only one element should be set as target ui
        }
      }

      if(DATA.EVENTPARAM){
        user_input.update_eventparam({brc: DATA.BRC, event: DATA.EVENT});
      }

      if(DATA.PAGEACTIVE){
        user_input.update_pagenumber.pagenumber(DATA.PAGEACTIVE.PAGENUMBER);
      }
    }

    if(DATA.DEBUGTEXT){
      debug_store.update_debugtext({brc: DATA.BRC, text: DATA.DEBUGTEXT});
    }

    if(DATA.MIDI){
      midi_monitor_store.update_midi({brc: DATA.BRC, midi: DATA.MIDI});
    }

    if(DATA.LOG){
      logger.set(DATA.LOG);
    }

    if(DATA.LUA){
      if(get(engine) == 'ENABLED'){
        runtime.update.one().status('GRID_REPORT').event(DATA.CONFIG_REPORT).config({lua: DATA.LUA}).trigger();
      } else {
        runtime.update.one().status('GRID_REPORT').event(DATA.CONFIG_REPORT).config({lua: DATA.LUA}); // USED ON MULTI FETCH BEFORE PAGE SAVE!
      }
    }

    if(DATA.CONFIG_ACKNOWLEDGE){
      //console.log('CONFIG ACK: ', DATA.CONFIG_ACKNOWLEDGE)
    }

    if(DATA.CONFIG_NACKNOWLEDGE){
      //console.log('CONFIG NACK: ', DATA.CONFIG_NACKNOWLEDGE)
    }

    if(DATA.PAGESTORE_ACKNOWLEDGE){
      //engine.strict.compare({brc: DATA.BRC, lastheader: DATA.PAGESTORE_ACKNOWLEDGE.LASTHEADER})
    }

    if(DATA.NVMERASE_ACKNOWLEDGE){
      //engine.strict.compare({brc: DATA.BRC, lastheader: DATA.NVMERASE_ACKNOWLEDGE.LASTHEADER})
    }

    writeBuffer.validate_incoming(DATA);
   
    _message_stream.set(DATA);

  }

  return {
    set: _on_data
  }

}


export const messageStream = createMessageStream();
