

import grid from '../protocol/grid-protocol.js';


import { messageStream } from './message-stream.store.js';  

import { writeBuffer } from '../runtime/engine.store.js';

import { debug_lowlevel_store } from '../main/panels/DebugMonitor/DebugMonitor.store.js';


// ============= NEW WEBSERIAL BASED IMPLEMENTATION ===================


let lineBuffer = '';
let latestValue = 0;

let port_connected = false;


navigator.serial.addEventListener('connect', (e) => {
  console.log("Serial Connect", e)
});

navigator.serial.addEventListener('disconnect', (e) => {
  console.log("Serial Disconnect", e)
  port_connected = false;
});


export async function testIt() {

  const env = window.ctxProcess.env();

  if (port_connected == false){

    const filters = [
      { usbVendorId: parseInt(env.USB_VID_0), usbProductId: parseInt(env.USB_PID_0) },
      { usbVendorId: parseInt(env.USB_VID_1), usbProductId: parseInt(env.USB_PID_1) }
    ];

    // console.log(navigator.serial)

    navigator.serial.requestPort({filters}).then(port=>{

      //console.log('port',port);

      navigator.intechPort = port

      port.open({ baudRate: 2000000}).then(e=>{

        port_connected = true;
  
        fetchStream()
    
        // port.readable
        //   .pipeThrough(new TextDecoderStream())
        //   .pipeTo(appendStream);


      }).catch(error => {
        //console.log(error)
      });
      

    }).catch(error => {
      //no port selected by the user
      //port_connected = false;
      //console.log(error)
    });

  }

  return false;
  
}

navigator.intechConnect = testIt

let result = [];

function fetchStream() {

  console.log('--------serial---------')

  if (port_connected !== true){
    return;
  }

  const reader = navigator.intechPort.readable.getReader();
  let charsReceived = 0;
  let rxBuffer = []

  // read() returns a promise that resolves
  // when a value has been received
  reader.read().then(function processText({ done, value }) {
    // Result objects contain two properties:
    // done  - true if the stream has already given you all its data.
    // value - some data. Always undefined when done is true.
    if (done) {
      console.log("Stream complete");
      para.textContent = value;
      return;
    }

    // value for fetch streams is a Uint8Array
    charsReceived += value.length;
    const chunk = value;

    let buffer = Array.from(chunk);


    for (let i = 0; i < buffer.length; i++) {
      rxBuffer.push(buffer[i]);
    }


    let messageStartIndex = 0;
    let messageStopIndex = 0;

    for(let i=0; i<rxBuffer.length; i++){

      if (rxBuffer[i] === 10){ // newline character found

        messageStopIndex = i;
        let currentMessage = rxBuffer.slice(messageStartIndex, messageStopIndex);
        messageStartIndex = i+1;

        //decode

        debug_lowlevel_store.push_inbound(currentMessage)

        let class_array = grid.decode_packet_frame(currentMessage);
        grid.decode_packet_classes(class_array);
      
        if(class_array !== false){
          messageStream.deliver_inbound(class_array);   
        }


      }
    }

    rxBuffer = rxBuffer.slice(messageStartIndex);


    // Read some more, and call this function again
    return reader.read().then(processText).catch(e=>{console.log(e)});
  });
}


navigator.intechFetch = fetchStream


// Send Serial data to the webserial interface


export async function serial_write_islocked(){

  if (port_connected !== true){
    return true;
  }

  if (navigator.intechPort === undefined || navigator.intechPort === null ){
    return true;
  }

  if (navigator.intechPort.writable === undefined || navigator.intechPort.writable === null){
    return true;
  }  



  let port = navigator.intechPort



  if (port.writable.locked === true){
    return false;
  }


}

export async function serial_write(param){

  if (param === undefined || port_connected !== true){
    return false;
  }


  if (navigator.intechPort === undefined || navigator.intechPort === null ){
    return false;
  }

  if (navigator.intechPort.writable === undefined || navigator.intechPort.writable === null){
    return false;
  }  

  param.push(10)

  debug_lowlevel_store.push_outbound(param)


  let port = navigator.intechPort



  if (port.writable.locked === true){
    console.log("SORRY it's locked")
    return false;
  }

  const writer = port.writable.getWriter();

  const data = new Uint8Array(param);

  writer.write(data).then(e => {
    // Allow the serial port to be closed later.
    writer.releaseLock();
    writeBuffer.writeBufferTryNext();

  }).catch(e => {
    console.log(e)
  })
  


}