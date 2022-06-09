/*

import WebSocket, { WebSocketServer } from 'ws';

export function initialize_wss(){

  console.log("WSS: initialize")

}

const wss = new WebSocketServer({ port: 8080 });

console.log("WSS",wss)

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', function connection(ws) {

  ws.isAlive = true;

  ws.on('pong', heartbeat);

  ws.on('message', function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});


wss.on('connection', function connection(ws, req) {
  const ip = req.socket.remoteAddress;
  console.log("WSS: IP", ip)

  ws.on('message', function message(data) {
    console.log('WSS: received: %s', data);
  });

  ws.send('something');
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', function close() {
  clearInterval(interval);
});

*/