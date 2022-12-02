import {ipcMain} from 'electron';
import WebSocket from 'ws';
import { store } from './main-store';

export const websocket = {
  mainWindow: undefined
};

let wss;
let interval;

startWebsocketServer(store.get('wssPort') || 1337);

function startWebsocketServer(port){

  wss = new WebSocket.Server({port: port});

  wss.on("error", error => console.log("The server encountered an error!", error)); 

  wss.on('connection', function (ws) {

    ws.isAlive = true;

    console.info('WS Client connected!')

    //connection = ws;

    ws.on('message', function message(data) {

      websocket.mainWindow.webContents.send('onWebsocketReceive', data);

      const decoded = JSON.parse(data)
      if (decoded.event === "grid_pong"){
        //console.log("WS PONG")
        ws.isAlive = true;
      }

    });

    ws.on('close', function(){
      console.warn('WS Client disconnected!')
    
    })

  });


  wss.on('close', function close(){
    console.log("CLEAR INTERVAL")
    clearInterval(interval);
  })

  console.log("SET INTERVAL")
  interval = setInterval(function ping() {

    const data = JSON.stringify({"event":"grid_ping"})
    websocket.mainWindow.webContents.send('onWebsocketTransmit', data);
  
    //console.log("PING")

    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) return ws.terminate();
  
      ws.isAlive = false;
      ws.send(data)
    });
  }, 5000);
  

}



ipcMain.handle('websocketTransmit', (event, arg) => {

  const decoded = JSON.parse(arg.message)

  const data = JSON.stringify({"event":"message", "data": decoded})
  websocket.mainWindow.webContents.send('onWebsocketTransmit', data);

  wss.clients.forEach(function each(ws) {
    ws.send(data)
  });

})

ipcMain.handle('websocketChangePort', (event, arg) => {

  console.log("NEW PORT", arg)

  if (wss !== undefined){
    wss.clients.forEach(function each(ws) {
      ws.terminate()
    });
  
    wss.close();
  }

  startWebsocketServer(arg);

})