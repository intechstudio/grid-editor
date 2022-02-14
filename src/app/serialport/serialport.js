import { writable, get } from 'svelte/store';

import { appSettings } from '../runtime/app-helper.store.js';
import { runtime, user_input, engine } from '../runtime/runtime.store.js';
import grid from '../protocol/grid-protocol.js';

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

import { messageStream } from './message-stream.store.js';  

import { debug_lowlevel_store } from '../main/panels/DebugMonitor/DebugMonitor.store.js';

export const serialComm = createSerialComm();

let port_disovery_interval;

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    port_disovery_interval = setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

let PORT = {path: 0};
let selectedPort = "";

// Basic serial usage

async function listSerialPorts(){

  SerialPort.list()
    .then(ports => {

      // collect serial ports with type grid

      serialComm.update((store) => { store.list = []; return store;});

      ports.forEach((port, i) => { 

        // check each port if it has productId with code ECAD or ecac...

        let isGrid = 0;
        
        if(port.productId){

          if(port.productId == 'ECAD' || port.productId == 'ecad' || port.productId == 'ECAC' || port.productId == 'ecac'){

            isGrid = 1;

            // add to serialComm store
            serialComm.update((store) => {   
              store.list = [...store.list, {isGrid: isGrid, port: port}]
              return store;
            });
          }
        }

      });

      // automatic open

      // pass the collection
      let gridSerialPorts = get(serialComm).list; // these are already filtered from other than grid ports
      // remove empty elements from array!
      gridSerialPorts = gridSerialPorts.filter(function (el) { return el != null; });

      const preferredPort = gridSerialPorts.find(p => p.port.path == get(serialComm).preferredPort);

      if(get(serialComm).open == undefined){
        if(preferredPort !== undefined){
          // open the preferred port
          closeSerialPort();
          selectedPort = preferredPort.port.path;
          openSerialPort();
        } else if(gridSerialPorts.length) {
          //open the first grid port found if preferred is not available but there are grid ports
          selectedPort = gridSerialPorts[0].port.path;
          openSerialPort(); 
        } else {
          // there is no grid serial port
          closeSerialPort();
        }     
      }

      // when changing cables on the fly
      const isStillAvailable = gridSerialPorts.find(p => p.port.path == selectedPort);
      if(!isStillAvailable){
        closeSerialPort();
      }

      // if no grid found ,kill
      const thereIsGrid = ports.find(p => p.productId == 'ECAD' || p.productId == 'ecad' || p.productId == 'ECAC' || p.productId == 'ecac');
      if(!thereIsGrid){
        closeSerialPort();
      }


    })

  .catch(err => {   
    console.error(err);
  });
}

function openSerialPort() {
  const store = get(serialComm);
  // don't let reopen port if it's already opened and dont let port open if serial array is empty!
  if(!store.isEnabled && store.list.length > 0){
    try {      
      const serial = store.list.find(serial => serial.port.path === selectedPort);
      PORT = new SerialPort({path: serial.port.path,baudRate: 2000000, autoOpen: false });
      serialComm.open(PORT);
      serialComm.selected(selectedPort);
      serialComm.enabled(true);
      readSerialPort();
    } catch (error) {
      console.error('readSerialPort() failed', error)
    }
    
  }

}

function closeSerialPort() {
  try{
    if(PORT.path !== 0){
      PORT.close(function(err){
        console.warn('Port closed', err)
      })

      // reset store
      serialComm.update((store)=>{
        store.open = undefined;
        store.isEnabled = false;
        store.list = [];
        return store
      });

      

      // reset runtime and user input on closing the port
      runtime.reset();

      
      appSettings.update(s => {s.overlays.controlElementName = false; return s})
      // clearup fifo writebuffer
      // reset engine to enabled
      engine.set('ENABLED');

      // reset port
      selectedPort = "";
      PORT = {path: 0};
    }
  }catch(e){
    console.log("SERIALPORT", e)
  }

}

function readSerialPort() {
      
  console.log('We are proceeding with reading the port.')

  PORT.open(function(err){
    if(err){
      console.error('Error opening port: ', err.message)
      closeSerialPort();
    }
  })

  PORT.on('error', function(err) {
    console.log('Error',err);
  });

  PORT.on('open', function() {
    console.log('Port is open.', PORT.path);  
    runSerialParser(PORT);
  }); 
}

function runSerialParser(port){

  const parser = port.pipe(new ReadlineParser({encoding: 'hex'}));

  parser.on('data', function(data) {

    // conver incoming data from hex blob to array of ascii codes
    let incoming_hex_array = Array.from(data);
    let asciicode_array = [];

    for (let i = 0; i < incoming_hex_array.length; i+=2) {
      asciicode_array.push(parseInt('0x'+incoming_hex_array[i] + incoming_hex_array[i+1]));
    }

    debug_lowlevel_store.push_inbound(asciicode_array)

    let class_array = grid.decode_packet_frame(asciicode_array);
    grid.decode_packet_classes(class_array);

    if(class_array !== false){
      messageStream.deliver_inbound(class_array);   
    }
  })

}


setIntervalAsync(listSerialPorts, 500)




function createSerialComm(){
  const store = writable({
    list: [],
    open: undefined,
    selected: '',
    isEnabled: false
  });


  return {
    ...store,
    enabled: (bool) => {
      store.update(store => {store.isEnabled = bool; return store;});
    },
    write: (args) => { 
      if(get(store).isEnabled){

        debug_lowlevel_store.push_outbound(args)

        let port = get(store).open;
        
        try {
          if(typeof args == 'object')
            port.write([...args, 10]);
          else
            port.write(args+'\n');
        } catch (error) {
          console.error('Serial write error', error)
        }
        
      }
      return;
    },
    selected: (port) => {
      store.update(store => {
        store.selected = port;
        return store;
      });
      return;
    },
    open: (port) => {
      store.update(store=>{
        store.open = port;
        return store;
      })
      return;
    }
  }
}


export const commIndicator = createCommIndicator();

function createCommIndicator(){

  const { subscribe, update } = writable({tx: 0, rx: 0});

	return {
		subscribe,
		tick: (direction) => {
      update(t => { t[direction] = 1; return t})
      setTimeout(()=>{
        update(t => { t[direction] = 0; return t })
      },100)
    }
	}
}



 