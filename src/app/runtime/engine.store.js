import { get, writable } from 'svelte/store';
import { appSettings } from './app-helper.store';
import grid from '../protocol/grid-protocol';
import { serial_write } from '../serialport/serialport';

const buffer_element = {
  responseRequired: true,
  responseTimeout: 2000,
  serial: '',
  filter: {id: '', event: {}, brc: {}},
  failCb: function(){console.log('fail')}, 
  successCb: function(){console.log('success')}
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
    

    //console.log(descr)
    //console.log(str)
    //console.log(retval.serial.toString())


    return {id: retval.id};
 
  }

  function writeBufferTryNext() {

    if(write_buffer_busy || _write_buffer.length == 0) return;

    write_buffer_busy = true;

    active_elem = _write_buffer[0];

    if(get(appSettings).debugMode)
      if(Math.random() > 0.3){
        serial_write(active_elem.serial);
      } else{
        console.error('GLITCH')
    } else {
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

    }

    _write_buffer.shift();

    if(active_elem.responseRequired !== undefined){

      const responseTimeout = active_elem.responseTimeout ?? 1000;

      startFetchTimeout(responseTimeout);

    } else {
      // heartbeat
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
    messages: messages,
    add_first: add_first,
    add_last: add_last,
    validate_incoming: validateIncoming,
    clear: clear,
    module_destroy_handler: module_destroy_handler,
  }

}

export const writeBuffer = createWriteBuffer();