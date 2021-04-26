import { GRID_PROTOCOL } from '../core/classes/GridProtocol';
import { serialComm } from '../core/serialport/serialport.store';

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
    //clearInterval(id);
  });
})

function writeSerialCommand({brc, command}){
  let data = GRID_PROTOCOL.encode_debugger(brc, command);
  // websocket debug info to client
  sendDataToClient('output', data);
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

  console.log(JSON.stringify({type: type, data: _serial}));


  if(connection !== undefined){
    connection.send(JSON.stringify({type: type, data: _serial}))
  }
  
}