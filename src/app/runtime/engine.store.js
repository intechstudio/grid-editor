import { get, writable } from 'svelte/store';
import { appSettings } from './app-helper.store';
import grid from '../protocol/grid-protocol';
import { serial_write, serial_write_islocked } from '../serialport/serialport';

import instructions from '../serialport/instructions';

export function sendHeartbeat(type){

  
  instructions.sendEditorHeartbeat_immediate(type)
  writeBuffer.writeBufferTryNext();

}

function createWriteBuffer (){

  const messages = writable([]);

  let _write_buffer = [];

  let write_buffer_busy = false;

  let active_elem = undefined;

  function module_destroy_handler(dx, dy){

    // remove all of the elements that match the destroyed module's dx dy
    _write_buffer = _write_buffer.filter(g => (g.descr.brc_parameters.DX!= dx || g.descr.brc_parameters.DY != dy));

    // clear the active element if it matches the destroyed module's dx dy
    if (active_elem !== undefined){

      if (active_elem.descr.brc_parameters.DX == dx && active_elem.descr.brc_parameters.DY == dy){
        active_elem = undefined;
        writeBufferTryNext();
      }

    }



  }

  function clear(){

    console.log("clear")

    _write_buffer = [];
    active_elem = undefined;
    write_buffer_busy = false;
    clearInterval(_fetch_timeout);
    
  }

  function sendDataToGrid(descr) {


    let retval = grid.encode_packet(descr);


    serial_write(retval.serial);

    // debugger for message ASCII frames
    let str = "";
    for (let i=0; i<retval.serial.length; i++){
      str += String.fromCharCode(retval.serial[i]);
    }
    

    return {id: retval.id};
 
  }

  function writeBufferTryNext() {


    if(write_buffer_busy || _write_buffer.length == 0) return;

    if (serial_write_islocked() === true){
      console.log("LOCK", _write_buffer.length)
      return;
    }


    write_buffer_busy = true;

    active_elem = _write_buffer[0];


    // create and send serial, save the ID for validation
    const { id } = sendDataToGrid(active_elem.descr);
    if(active_elem.responseRequired){

      if (active_elem.filter !== undefined){
        if (active_elem.filter.class_parameters !== undefined){
          if (active_elem.filter.class_parameters['LASTHEADER'] !== undefined){
          
            active_elem.filter.class_parameters['LASTHEADER'] = id;
            //console.log("LASTHEADER SET TO", id)

          }
        }
      }

    }

    

    _write_buffer.shift();

    if(active_elem.responseRequired === true){

      const responseTimeout = active_elem.responseTimeout ?? 300;

      startFetchTimeout(responseTimeout);

    } else {
      active_elem = undefined;
      write_buffer_busy = false;
      writeBufferTryNext();
    }

  };

  let _fetch_timeout = undefined;
  function startFetchTimeout(timeout) {
    _fetch_timeout = setTimeout(()=>{
      fetchTimeoutCallback();
    }, timeout)
  }

  function fetchTimeoutCallback(){

    if(active_elem !== undefined){

      active_elem.failCb();

      write_buffer_busy = false;

      add_first(active_elem);
    }

  }

  function validateIncoming(descr) {


    // check if there is an active_elem availabe
    if(!active_elem) return

    // check if active_elem has filter
    if(!active_elem.hasOwnProperty('filter')) return;

    if(descr.class_name === 'HEARTBEAT'){
      return;
    }
    let incomingValid = true;

    // validate BRC, must start with this as every input contains BRC!
    for (const parameter in active_elem.filter.brc_parameters) {
      if(descr.brc_parameters[parameter] != active_elem.filter.brc_parameters[parameter]){
        incomingValid = false;
      }
    }

    if(descr.class_name === active_elem.filter.class_name){
      
      for (const parameter in active_elem.filter.class_parameters) {
        if(descr.class_parameters[parameter] != active_elem.filter.class_parameters[parameter]){
          incomingValid = false;
        }
      }

    } else {
      incomingValid = false;
    }

 
    if(incomingValid){
      if (active_elem.successCb!== undefined){
        active_elem.successCb(descr);
      }
      active_elem = undefined;
      write_buffer_busy = false;
      clearInterval(_fetch_timeout);
      writeBufferTryNext();
    } else {

      // not matched, maybe later
    }
  }

  function add_first(obj){
    _write_buffer.splice(0,0,obj);
    writeBufferTryNext();
  }

  function add_last(obj){
    _write_buffer = [..._write_buffer, obj];
    writeBufferTryNext();
  }

  

  return {
    writeBufferTryNext: writeBufferTryNext,
    messages: messages,
    add_first: add_first,
    add_last: add_last,
    validate_incoming: validateIncoming,
    clear: clear,
    module_destroy_handler: module_destroy_handler,
  }

}

export const writeBuffer = createWriteBuffer();