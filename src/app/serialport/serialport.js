

import grid from '../protocol/grid-protocol.js';
const { exec } = require("child_process");

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

import { messageStream } from './message-stream.store.js';  

import { appSettings } from '../runtime/app-helper.store.js';

import { debug_lowlevel_store } from '../main/panels/DebugMonitor/DebugMonitor.store.js';


const { ipcRenderer, app } = require('electron');



let port_disovery_interval;

const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    port_disovery_interval = setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

// ============= NEW WEBSERIAL BASED IMPLEMENTATION ===================


let lineBuffer = '';
let latestValue = 0;

let port_connected = false;

export async function testIt() {


  if (port_connected == false){

    const filters = [
      { usbVendorId: parseInt(process.env.USB_VID_0), usbProductId: parseInt(process.env.USB_PID_0) },
      { usbVendorId: parseInt(process.env.USB_VID_1), usbProductId: parseInt(process.env.USB_PID_1) }
    ];

    const port = await navigator.serial.requestPort({filters});
    const portInfo = port.getInfo();

    navigator.intechPort = port

    await port.open({ baudRate: 2000000});

    port_connected = true;

    const appendStream = new WritableStream({
        write(chunk) {
          lineBuffer += chunk;

          let lines = lineBuffer.split('\n');

          if (lines.length > 1) {
            lineBuffer = lines.pop();

            let foo = lines.pop()
            //console.log("RX: "+ foo)

            let asciicode_array = [];
            let buffer = Buffer.from(foo, 'ascii');
            for (let i = 0; i < buffer.length; i++) {
              asciicode_array.push(buffer[i]);
            }

            debug_lowlevel_store.push_inbound(asciicode_array)

            let class_array = grid.decode_packet_frame(asciicode_array);
            grid.decode_packet_classes(class_array);
          
            if(class_array !== false){
              messageStream.deliver_inbound(class_array);   
            }

          }
        }
      });

    port.readable
      .pipeThrough(new TextDecoderStream())
      .pipeTo(appendStream);

  }
  
}

navigator.intechConnect = testIt



// Send Serial data to the webserial interface
export async function serial_write(param){

  if (param === undefined){
    return;
  }

  param.push(10)

  debug_lowlevel_store.push_outbound(param)



  if (navigator.intechPort === undefined || navigator.intechPort === null ){
    return;
  }

  if (navigator.intechPort.writable === undefined || navigator.intechPort.writable === null){
    return;
  }  



  let port = navigator.intechPort
  const writer = port.writable.getWriter();

  const data = new Uint8Array(param);

  await writer.write(data);
  
  // Allow the serial port to be closed later.
  writer.releaseLock();

}