const {ipcMain} = require('electron');
const WebSocket = require('ws');

let websocket = {

  mainWindow: undefined

};

let wss;
let interval;

function startWebsocketServer(port){

  wss = new WebSocket.Server({port: port});

  wss.on("error", error => console.log("The server encountered an error!", error)); 

  wss.on('connection', function (ws) {

    ws.isAlive = true;

    console.warn('WS Client connected!')

    connection = ws;

    ws.on('message', function message(data) {


      websocket.mainWindow.webContents.send('wss_rx', data);

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
    websocket.mainWindow.webContents.send('wss_tx', data);
  
    //console.log("PING")

    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) return ws.terminate();
  
      ws.isAlive = false;
      ws.send(data)
    });
  }, 5000);
  

}





console.log("WEBSOCKET")


ipcMain.on('websocket_tx', (event, arg) => {

  console.log(arg)
  const decoded = JSON.parse(arg)

  const data = JSON.stringify({"event":"message", "data": decoded})
  websocket.mainWindow.webContents.send('wss_tx', data);

  wss.clients.forEach(function each(ws) {
    ws.send(data)
  });

})

ipcMain.on('websocket_changePort', (event, arg) => {

  console.log("NEW PORT", arg)

  if (wss !== undefined){
    wss.clients.forEach(function each(ws) {
      ws.terminate()
    });
  
    wss.close();
  }

  

  startWebsocketServer(arg);

})



module.exports = {websocket};