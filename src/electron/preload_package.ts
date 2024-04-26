const { contextBridge, ipcRenderer } = require("electron");

const windowLoaded = new Promise((resolve) => {
  window.onload = resolve;
});

ipcRenderer.on("package-port", async (event) => {
  await windowLoaded;
  window.postMessage("package-port", "*", event.ports);
});
