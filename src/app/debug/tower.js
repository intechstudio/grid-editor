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

function writeSerialCommand({brc, command}){
  let data = grid.translate.encode_debugger(brc, command);
  // websocket debug info to client
  sendDataToClient('output', data);
  console.log('THIS IS FROM SDEBUGGER', data);
  serialComm.write(data);    
}


export function sendDataToClient(type, serial){

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