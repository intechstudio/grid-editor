import {keyboard, Key} from "@nut-tree/nut-js";
import WebSocket from 'ws';

keyboard.config = { autoDelayMs: 10 }

let webSocketClient: WebSocket | undefined = undefined;
let webSocketUrl = 'ws://localhost:1337'
let connectionCheckInterval = 2000;
let receivedMessages: any = [];
let wsClientStatus: string | undefined = undefined;

function connectToWebSocket(){
  if(webSocketClient){
    console.info('WebSocket is already connected, disconnect first.');
    return;
  }

  webSocketClient = new WebSocket(webSocketUrl);

  webSocketClient.addEventListener('open', function(){
    wsClientStatus = 'open';
    console.info("WS is open");
  })

  webSocketClient.addEventListener('close', function(event){
    console.info("WS close");
    wsClientStatus = 'closed';
    webSocketClient = undefined;
  })

  webSocketClient.addEventListener('error', function(event) {
    wsClientStatus = 'error';
    console.info("WS error", event)
  })

  webSocketClient.addEventListener('message', function(event){
    receivedMessages.push(event.data);

    const EDITOR_PACKET = JSON.parse(event.data);
    
    switch (EDITOR_PACKET["event"]) {
      case "message":
        if(EDITOR_PACKET.data != undefined){
          const decodedMessage = JSON.parse(EDITOR_PACKET.data);
          console.log(decodedMessage, decodedMessage.plugin)
          if(decodedMessage.plugin == 'nut'){
            typeKey(decodedMessage.key);
          }
        }
        break;
      case "grid_ping":
        webSocketClient?.send(JSON.stringify({"event": "grid_pong"}));
        break;
      default:
        
    }
  })

}



export async function nutPlugin(){

  setInterval(()=>{
    connectToWebSocket();
  }, connectionCheckInterval)

}


async function typeKey(key: Key){ 
  console.log('typekey', key)
  await keyboard.type(Key[key]);
}