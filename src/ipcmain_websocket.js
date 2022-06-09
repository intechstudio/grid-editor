const {ipcMain} = require('electron');
const WebSocket = require('ws');

let websocket = {

  mainWindow: undefined

};

let connection = undefined;

let wss = new WebSocket.Server({port: 1337});

console.log("WEBSOCKET")

wss.on("error", error => console.log("The server encountered an error!", error)); 

ipcMain.on('websocket_tx', (event, arg) => {

  if(connection !== undefined){
    connection.send('hello-' + arg)
  }

})


function heartbeat(ws) {
  ws.isAlive = true;
}

wss.on('connection', function (ws) {

  ws.isAlive = true;

  console.warn('WS Client connected!')

  connection = ws;

  ws.on('message', function message(data) {

    const decoded = JSON.parse(data)
    if (decoded.event === "grid_pong"){
      //console.log("WS PONG")
      heartbeat(ws)
    }

    
    websocket.mainWindow.webContents.send('websocket_rx', data);

  });

  ws.on('close', function(){
    console.warn('WS Client disconnected!')
    clearInterval(ws.pingInterval);
  
  })
  

});

// close connections that have timed out
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.send(JSON.stringify({"event":"grid_ping"}))
  });
}, 5000);



wss.on('close', function close(){
  clearInterval(interval);
})



module.exports = {websocket};