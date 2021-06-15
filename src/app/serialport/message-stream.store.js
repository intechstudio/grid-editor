// Top level imports
import { writable, get } from 'svelte/store';
import { appSettings } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import { debug_store, runtime, user_input, logger, engine } from '../runtime/runtime.store';

const engine_state = engine.state;

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
    if(get(engine_state) == 'ENABLED'){
      if(DATA.EVENT){
        if(get(appSettings).changeOnContact){
          user_input.grid_update({brc: DATA.BRC, event: DATA.EVENT[0]}); // only one element should be set as target ui
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

    if(DATA.LOG){
      logger.set(DATA.LOG);
    }

    if(DATA.CONFIG_LUA){
      runtime.update.status('GRID_REPORT').config({lua: DATA.CONFIG_LUA}).trigger(true)
    }

    if(DATA.CONFIG_ACKNOWLEDGE){
      console.log('CONFIG ACK: ', DATA.CONFIG_ACKNOWLEDGE)
    }

    if(DATA.CONFIG_NACKNOWLEDGE){
      console.log('CONFIG NACK: ', DATA.CONFIG_NACKNOWLEDGE)
    }

    if(DATA.CONFIGSTORE){
      engine.strict.compare({brc: DATA.BRC, lastheader: DATA.CONFIGSTORE.LASTHEADER})
    }

    if(DATA.CONFIGERASE){
      engine.strict.compare({brc: DATA.BRC, lastheader: DATA.CONFIGERASE.LASTHEADER})
    }

    _message_stream.set(DATA);

  }

  return {
    set: _on_data
  }

}


export const messageStream = createMessageStream();
