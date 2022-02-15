

import grid from '../protocol/grid-protocol.js';
const { exec } = require("child_process");

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

import { messageStream } from './message-stream.store.js';  

import { appSettings } from '../runtime/app-helper.store.js';

import { debug_lowlevel_store } from '../main/panels/DebugMonitor/DebugMonitor.store.js';


const { ipcRenderer, app } = require('electron');

// Receive Serial data from the IPCMain process
ipcRenderer.on('serialport_rx', function (evt, message) {

  //console.log(message); // Returns: {'SAVED': 'File Saved'}

  // conver incoming data from hex blob to array of ascii codes
  let incoming_hex_array = Array.from(message);
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

});



// Send Serial data to the IPCMain process
export function serial_write(param){

  if (param === undefined){
    return;
  }

  debug_lowlevel_store.push_outbound(param)

  ipcRenderer.send('serialport_tx', param);

}