/**
 * 
 * This "nutjs" npm package was introduced in 1.2.26 and broke windows 7 and older mac os versions.
 * 
 */



// import {keyboard, Key} from "@nut-tree/nut-js";
// import { shell } from "electron";
// import WebSocket from 'ws';

// keyboard.config = { autoDelayMs: 30 }

// let webSocketClient: WebSocket | undefined = undefined;
// let webSocketUrl = 'ws://localhost:1337'
// let connectionCheckInterval = 2000;
// let receivedMessages: any = [];
// let wsClientStatus: string | undefined = undefined;

// let websocketInterval: NodeJS.Timeout | undefined = undefined;

export async function desktopAutomationPluginStart(){

//   if(websocketInterval){
//     clearInterval(websocketInterval);
//   }

//   websocketInterval = setInterval(()=>{
//     connectToWebSocket();
//   }, connectionCheckInterval)

}

export async function desktopAutomationPluginStop(){
//   if(websocketInterval){
//     clearInterval(websocketInterval);
//   }

//   webSocketClient?.close();
}

// function connectToWebSocket(){
//   if(webSocketClient){
//     console.info('WebSocket is already connected, disconnect first.');
//     return;
//   }

//   webSocketClient = new WebSocket(webSocketUrl);

//   webSocketClient.addEventListener('open', function(){
//     wsClientStatus = 'open';
//     console.info("WS is open");
//   })

//   webSocketClient.addEventListener('close', function(event){
//     console.info("WS close");
//     wsClientStatus = 'closed';
//     webSocketClient = undefined;
//   })

//   webSocketClient.addEventListener('error', function(event) {
//     wsClientStatus = 'error';
//     console.info("WS error", event)
//   })

//   webSocketClient.addEventListener('message', function(event){
//     receivedMessages.push(event.data);

//     const EDITOR_PACKET = JSON.parse(event.data);

//     console.log('DATA here', EDITOR_PACKET.data)

//     switch (EDITOR_PACKET["event"]) {
//       case "message":
//         if(EDITOR_PACKET.data != undefined){
//           // this is a correction hack for file paths!
//           EDITOR_PACKET.data = EDITOR_PACKET.data.replace(/\\/g, '\\\\');
//           const decodedMessage = JSON.parse(EDITOR_PACKET.data);
//           console.log('here it fails');
//           if(decodedMessage.plugin == 'desktopAutomation'){
//             dataHandler(decodedMessage.data);
//           }
//         }
//         break;
//       case "grid_ping":
//         webSocketClient?.send(JSON.stringify({"event": "grid_pong"}));
//         break;
//       default:
        
//     }
//   })

// }


// async function dataHandler(data){

//   for (const instruction of data) {
//     if(instruction.hasOwnProperty('key') == true){
//       await typeKey(instruction.key);
//     }

//     if(instruction.hasOwnProperty('text') == true){
//       await typeText(instruction.text);
//     }

//     if(instruction.hasOwnProperty('url') == true){
//       await openUrl(instruction.url);
//     }

//     if(instruction.hasOwnProperty('path') == true){
//       await openPath(instruction.path);
//     }
//   }

// }

// // example: websocket_send('{"plugin": "desktopAutomation", "data": [{"url": "https://google.com"}] }')
// // websocket_send('{"plugin": "desktopAutomation", "data": [{"path": "D:\\Content\\examples"}] }')

// async function typeKey(key: Key){ 
//   await keyboard.type(Key[key]);
//   return key;
// }

// async function typeText(text: string){
//   await keyboard.type(text);
//   return text;
// }

// async function openUrl(url: string){
//   await shell.openExternal(url);
//   return url;
// }

// async function openPath(path: string){
//   console.log(path)
//   await shell.openPath(path);
//   return path;
// }