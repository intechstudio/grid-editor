import { get, writable } from 'svelte/store';
import { appSettings } from '../main/_stores/app-helper.store';
import grid from '../protocol/grid-protocol';
import { serialComm } from '../serialport/serialport.store';

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

  const clean_up = function (){

    this.one = function(device){

      console.error("clean_up");

      writeBufferTryNext();

    }

    this.all = function(){
      _write_buffer = [];
      active_elem = undefined;
      write_buffer_busy = false;
      clearInterval(_fetch_timeout);

      console.info('Clean up >all< writeBuffer!', active_elem, _write_buffer);

    }
    
  }

  function sendDataToGrid(descr) {


    console.log("SEND", descr)

    let retval = grid.translate.encode_suku(descr);


    serialComm.write(retval.serial);


    let str = "";
    for (let i=0; i<retval.serial.length; i++){
      str += String.fromCharCode(retval.serial[i]);
    }
    console.log("SEND", descr, str)

    return {id: retval.id};
 
  }

  function writeBufferTryNext() {

    if(write_buffer_busy || _write_buffer.length == 0) return;

    write_buffer_busy = true;

    active_elem = _write_buffer[0];

    if(get(appSettings).debugMode)
      if(Math.random() > 0.3){
        serialComm.write(active_elem.serial);
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
              console.log("LASTHEADER SET TO", id)

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
    clean_up: new clean_up()
  }

}

export const writeBuffer = createWriteBuffer();