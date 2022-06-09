import {debug_lowlevel_store} from "../main/panels/WebsocketMonitor/WebsocketMonitor.store"

const { ipcRenderer, app } = require('electron');


export function initialize_ws(){

  console.log("WS: initialize")

}

export function wss_send_message(msg){

  ipcRenderer.send("websocket_tx", JSON.stringify(msg))

}

ipcRenderer.on('wss_rx', (event, args) => {

  debug_lowlevel_store.push_inbound(new TextEncoder().encode(args))

})

ipcRenderer.on('wss_tx', (event, args) => {

  debug_lowlevel_store.push_outbound(new TextEncoder().encode(args))
  
})

let heartbeatTimeout;

const client = new WebSocket('ws://localhost:1337');

console.log("WS: ", client);

client.addEventListener('open', e => {

  heartbeatTimeout = setTimeout(e=>{client.close()}, 5000 + 1000);

  client.addEventListener('message', function message(data) {

    const decoded = JSON.parse(data.data)


    if (decoded.event === "grid_ping"){

      //console.log("PING")
      clearTimeout(heartbeatTimeout)
      heartbeatTimeout = setTimeout(e=>{client.close()}, 5000 + 1000);

      client.send(JSON.stringify({"event":"grid_pong"}))
    }
  });
});


client.addEventListener('close', function clear() {
  console.log("CONNECTION CLOSED")
  clearTimeout(heartbeatTimeout)
});



// let heartbeatTimeout2;

// const client2 = new WebSocket('ws://localhost:1337');

// console.log("WS: ", client2);

// client2.addEventListener('open', e => {

//   heartbeatTimeout2 = setTimeout(e=>{client2.close()}, 5000 + 1000);

//   client2.addEventListener('message', function message(data) {

//     const decoded = JSON.parse(data.data)


//     if (decoded.event === "grid_ping"){

//       //console.log("PING")
//       clearTimeout(heartbeatTimeout2)
//       heartbeatTimeout2 = setTimeout(e=>{client2.close()}, 5000 + 1000);

//       client2.send(JSON.stringify({"event":"grid_pong"}))
//     }
//   });
// });


// client2.addEventListener('close', function clear() {
//   console.log("CONNECTION CLOSED")
//   clearTimeout(heartbeatTimeout2)
// });