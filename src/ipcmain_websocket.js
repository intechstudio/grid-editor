const {ipcMain} = require('electron');
const WebSocket = require('ws');

let websocket = {

  mainWindow: undefined

};

let connection = undefined;

let wss = new WebSocket.Server({port: 1337});

wss.on("error", error => console.log("The server encountered an error!", error)); 

ipcMain.on('websocket_tx', (event, arg) => {

  if(connection !== undefined){
    connection.send('hello-' + arg)
  }

})


wss.on('connection', function (ws) {

  connection = ws;

  ws.on('message', function message(data) {
    console.log('received websocket data: ', data);
    
    websocket.mainWindow.webContents.send('websocket_rx', data);

  });

  ws.on('close', function(){
    console.warn('WS Client disconnected!')
  })

});


module.exports = {websocket};