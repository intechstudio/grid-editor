const WebSocket = require('ws');

const wss = new WebSocket.Server({port: 1337})

let connection = undefined;

wss.on('connection', function (ws) {

  connection = ws;

  ws.on('message', function message(data) {
    console.log('received websocket data: ', data);
  });

  ws.on('close', function(){
    console.warn('Client disconnected!')
  })

});

let counter = 0;
export function sendDataToWebsocketClient(data){
  if(connection !== undefined){
    connection.send('hello-' + counter++)
  }
}