import { get } from "svelte/store";
import {debug_lowlevel_store} from "../main/panels/WebsocketMonitor/WebsocketMonitor.store"
import { appSettings } from "./app-helper.store";

//const ipcRenderer = window.sketchyAPI;


let client
let heartbeatTimeout;

console.log("WSS PORT", get(appSettings).persistant.wssPort)

export function initialize_ws(){

  console.log("WS: initialize")

}

export function wss_send_message(msg){


  const toSend = Buffer.from(msg).toString('base64')
  //ipcRenderer.send("websocket_tx", JSON.stringify(toSend))

}

let wssPort = undefined;

appSettings.subscribe(appS => {

  if (appS.persistant.wssPort !== wssPort){
    wssPort = appS.persistant.wssPort 
    console.log("WSS UPDATED", wssPort);

    wss_change_port(wssPort)

  }




});
/**ipcRenderer.on('wss_rx', (event, args) => {

  debug_lowlevel_store.push_inbound(new TextEncoder().encode(args))

})

ipcRenderer.on('wss_tx', (event, args) => {

  debug_lowlevel_store.push_outbound(new TextEncoder().encode(args))
  
})

 */


function websocketStart(){

  client = new WebSocket('ws://localhost:'+get(appSettings).persistant.wssPort);

  console.log("WS: ", client);

  client.addEventListener('open', e => {

    heartbeatTimeout = setTimeout(e=>{client.close()}, 5000 + 1000);

    client.addEventListener('message', function message(data) {

      const decoded = JSON.parse(data.data)

      //console.log("MESSAGE", decoded)

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

}

export function wss_change_port(port){
  console.log("PORTCHANGE", port)
  //ipcRenderer.send("websocket_changePort", port)

  if (client !== undefined){

    client.close();
  }

  websocketStart();

}

