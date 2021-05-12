import { get } from 'svelte/store';
import instructions from '../serialport/instructions.js';
import { runtime, rtUpdate, localInputStore } from './runtime.store.js';
import _utils from './_utils.js';


function findUpdateDestination(_runtime, li){

  let _event;

  _runtime.forEach((device) => {
    if(device.dx == li.brc.dx && device.dy == li.brc.dy){
      _event = device.pages[li.event.pagenumber][li.event.elementnumber].events.find(e => e.event.value == li.event.eventtype);
    }
  });

  return _event;
}

const rt = {

  update: ({lua}) => {
    const li = get(localInputStore);
    runtime.update(_runtime => {
      let dest = findUpdateDestination(_runtime, li);
      if (dest) {
        dest.config = lua.trim();
        dest.cfgStatus = "changed";
      }
      
      console.info('Runtime updated: ', dest);

      /*
      Tell runtime what changed! Sent it to grid!
      */

      instructions.sendConfigToGrid({lua, li});

      return _runtime;
    })
  }

}

export default rt;