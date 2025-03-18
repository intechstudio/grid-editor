import WebSocket from "ws";

let wss: WebSocket.Server | undefined;

function startWebsocketServer(onMessageReceived: (data: any) => void) {
  wss = new WebSocket.Server({ port: 9000 });

  wss.on("error", (error) =>
    console.log("The server encountered an error!", error)
  );

  wss.on("connection", function (ws) {
    console.info("WS Developer Client connected!");
    ws.on("message", function message(data) {
      console.log("WS DEVELOPER message:", { data });
      let jsonData = JSON.parse(data);
      onMessageReceived(jsonData);
    });

    ws.on("close", function () {
      console.warn("WS Client disconnected!");
    });
  });
}

function stopWebsocketServer() {
  if (!wss) return;

  wss.close();
  for (const ws of wss.clients) {
    ws.terminate();
  }
  wss = undefined;
}

export const developerWebsocket = {
  startWebsocketServer,
  stopWebsocketServer,
};
