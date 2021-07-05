import { get, writable } from 'svelte/store';
import { serialComm } from '../serialport/serialport.store';

const buffer_element = {
  responseRequired: true,
  serial: '',
  filter: {id: '', event: {}, brc: {}},
  failCb: function(){console.log('fail')}, 
  successCb: function(){console.log('success')}
}


function createWriteBuffer (){

  const _write_buffer = writable([Object.create(buffer_element)]);

  const _engine = writable(0); // state

  let write_buffer_busy = false;

  let active_elem = undefined;
  
  _write_buffer.subscribe(value => { 
    writeBufferTryNext();
  })

  function writeBufferTryNext() {

    active_elem = get(_write_buffer)[0];

    if(write_buffer_busy || active_elem !== {}){ return }

    write_buffer_busy = true;

    _write_buffer.update(s => {
      if(s.length){
        s.shift(); 
      }
      return s
    });

    serialComm.write(active_elem.serial);

    if(active_elem.responseRequired !== undefined){

      // if config fetch

      startFetchTimeout();

    } else {

      console.log('CANCEL OUT')

      // heartbeat
      active_elem = undefined;
      write_buffer_busy = false;
      writeBufferTryNext();

    }



  };

  let _fetch_timeout = undefined;
  function startFetchTimeout() {
    _fetch_timeout = setTimeout(()=>{

      fetchTimeoutCallback();

    }, 2000)
  }

  function fetchTimeoutCallback(){

    if(active_elem.failCb !== undefined){

      active_elem.failCb();

      write_buffer_busy = false;

      add_first(active_elem);
    }

  }

  function add_first(obj){
    _write_buffer.update(s => {
      s.splice(0,0,obj);
      return s;
    })
  }

  function add_last(obj){
    _write_buffer.update(s => {
      s = [...s, obj];
      return s;
    })
  }

  function validateIncoming(data) {

    // compare data and filter key - value pairs


    let isHeartbeat = false;
    for (const _class in data) {
      if(_class == 'HEARTBEAT'){
        isHeartbeat = true;
      }
    }

    if(isHeartbeat) return;

    let incomingValid = true;

    // validate filter classParameters
    for (const parameter in active_elem.filter.classParameters){
      if(data.hasOwnProperty(active_elem.filter.className)){
        if(data[active_elem.filter.className][parameter] !== active_elem.filter.classParameters[parameter]){
          incomingValid = false;
        }
      }
    }

    // validate BRC
    for (const parameter in active_elem.filter.brc) {
      if(data.BRC[parameter] !== active_elem.filter.brc[parameter]){
        incomingValid = false;
      }
    }


    if(incomingValid){
      active_elem.successCb();
      active_elem = undefined;
      writeBufferTryNext();
    } else {
      // not matched, maybe later
    }
  }


  return {
    add_first: add_first,
    add_last: add_last,
    validate_incoming: validateIncoming

  }

}

export const writeBuffer = createWriteBuffer();