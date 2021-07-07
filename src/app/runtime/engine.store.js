import { get, writable } from 'svelte/store';
import { appSettings } from '../main/_stores/app-helper.store';
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

  function writeBufferTryNext() {

    if(write_buffer_busy || _write_buffer.length == 0) return;

    write_buffer_busy = true;

    active_elem = _write_buffer[0];

    if(active_elem.hasOwnProperty('commandCb')){
      active_elem.commandCb();
      write_buffer_busy = false;
      return;
    }

    if($appSettings.debugMode)
      if(Math.random() > 0.3){
        serialComm.write(active_elem.serial);
      } else{
        console.error('GLITCH')
    } else {
      serialComm.write(active_elem.serial);
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
    console.log('timeout', timeout);
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

  function validateIncoming(data) {

    // compare data and filter key - value pairs

    if(!active_elem) return

    let isHeartbeat = false;
    for (const _class in data) {
      if(_class == 'HEARTBEAT'){
        isHeartbeat = true;
      }
    }

    if(isHeartbeat) return;    

    let incomingValid = true;


    // validate BRC, must start with this as every input contains BRC!
    for (const parameter in active_elem.filter.brc) {
      if(data.BRC[parameter] != active_elem.filter.brc[parameter]){
        incomingValid = false;
      }
    }

    if(data.hasOwnProperty(active_elem.filter.className)){

      for (const parameter in active_elem.filter[active_elem.filter.className]) {
        if(data[active_elem.filter.className][parameter] != active_elem.filter[active_elem.filter.className][parameter]){
          incomingValid = false;
        }
      }

    } else {

      incomingValid = false;

    }

    if(incomingValid){
      active_elem.successCb();
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
    validate_incoming: validateIncoming
  }

}

export const writeBuffer = createWriteBuffer();