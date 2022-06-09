const {ipcMain} = require('electron');
const WebSocket = require('ws');

let websocket = {

  mainWindow: undefined

};


let wss = new WebSocket.Server({port: 1337});

console.log("WEBSOCKET")

wss.on("error", error => console.log("The server encountered an error!", error)); 

ipcMain.on('websocket_tx', (event, arg) => {

  console.log(arg)
  const decoded = JSON.parse(arg)

  const data = JSON.stringify({"event":"message", "data": decoded})
  websocket.mainWindow.webContents.send('wss_tx', data);

  wss.clients.forEach(function each(ws) {
    ws.send(data)
  });

})

function heartbeat(ws) {
  ws.isAlive = true;
}

wss.on('connection', function (ws) {

  ws.isAlive = true;

  console.warn('WS Client connected!')

  connection = ws;

  ws.on('message', function message(data) {


    websocket.mainWindow.webContents.send('wss_rx', data);

    const decoded = JSON.parse(data)
    if (decoded.event === "grid_pong"){
      //console.log("WS PONG")
      heartbeat(ws)
    }

  });

  ws.on('close', function(){
    console.warn('WS Client disconnected!')
    clearInterval(ws.pingInterval);
  
  })
  

});

// close connections that have timed out
const interval = setInterval(function ping() {

  const data = JSON.stringify({"event":"grid_ping"})
  websocket.mainWindow.webContents.send('wss_tx', data);

  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.send(data)
  });
}, 5000);



wss.on('close', function close(){
  clearInterval(interval);
})



module.exports = {websocket};