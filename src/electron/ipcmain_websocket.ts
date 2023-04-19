import { ipcMain } from "electron";
import WebSocket from "ws";
import { store } from "./main-store";

export const websocket = {
  mainWindow: undefined,
};

let wss;
let interval;

startWebsocketServer(store.get("wssPort") || 1337);

function startWebsocketServer(port) {
  wss = new WebSocket.Server({ port: port });

  wss.on("error", (error) =>
    console.log("The server encountered an error!", error)
  );

  wss.on("connection", function (ws) {
    ws.isAlive = true;
    console.info("WS Client connected!");
    ws.on("message", function message(data) {
      websocket.mainWindow.webContents.send("onWebsocketReceive", data);
      const decoded = JSON.parse(data);
      if (decoded.event === "grid_pong") {
        ws.isAlive = true;
      }
    });

    ws.on("close", function () {
      console.warn("WS Client disconnected!");
    });
  });

  wss.on("close", function close() {
    clearInterval(interval);
  });

  interval = setInterval(function ping() {
    const data = JSON.stringify({ event: "grid_ping" });
    websocket.mainWindow.webContents.send("onWebsocketTransmit", data);

    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.send(data);
    });
  }, 5000);
}

ipcMain.handle("websocketTransmit", async (event, arg) => {
  const data = JSON.stringify(arg.message);

  websocket.mainWindow.webContents.send("onWebsocketTransmit", data);

  wss.clients.forEach(function each(ws) {
    ws.send(data);
  });
});

ipcMain.handle("websocketChangePort", async (event, arg) => {
  if (wss !== undefined) {
    wss.clients.forEach(function each(ws) {
      ws.terminate();
    });

    wss.close();
  }

  startWebsocketServer(arg);
});
