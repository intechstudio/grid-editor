import { serialComm } from '../serialport/serialport.store';

import grid from '../protocol/grid-protocol.js';

const WebSocket = require('ws');

const wss = new WebSocket.Server({port: 1040})

let connection = undefined;

let filters = {
  heartbeat: false
}

wss.on('connection', function (ws) {
  console.log('Client connected!')
    
  connection = ws;

  ws.on('message', function (evt) {
    const msg = JSON.parse(evt);
    let type = msg.type;
    let data = msg.data;

    if(type == 'filter'){
      filters[data.class] = data.status;
    }
    if(type == 'command'){
      writeSerialCommand(data)
    }
  });


  ws.on('close', function () {
    console.log('Client disconnected!');
  });
})

function writeSerialCommand({dx, dy, command}){
  const brc = {dx: dx, dy: dy}
  const data = grid.translate.encode_debugger(brc, command);
  sendDataToClient('output', data);
  serialComm.write(data);    
}


export function sendDataToClient(type, array){

  let serial = '';
  if(Array.isArray(array)){
    array.forEach((element, i) => {
      serial += String.fromCharCode(element);
    })
  } else {
    serial = array;
  }

  if(!serial) return;

  if(serial.slice(30).startsWith('010') && serial.length == 48){
    if(filters.heartbeat){
      return;
    } else {
      type = 'heartbeat'
    }
  }

  let _serial = []
  Array.from(serial).forEach(c => {
    _serial.push(c.charCodeAt(0))
  });

  if(connection !== undefined){
    connection.send(JSON.stringify({type: type, data: _serial}))
  }
  
}