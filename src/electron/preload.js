const { contextBridge, ipcRenderer } = require('electron')
const {BrowserWindow, getCurrentWindow, getGlobal} = require( "@electron/remote");

contextBridge.exposeInMainWorld('variables', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  platform: () => process.platform,
  // we can also expose variables, not just functions
})


contextBridge.exposeInMainWorld('sketchyAPI', {
    send: ipcRenderer.send,
    sendSync: ipcRenderer.sendSync,
    on:  ipcRenderer.on,
    removeAllListeners: ipcRenderer.removeAllListeners
})


contextBridge.exposeInMainWorld('sketchyRemote', {
  closeWindow: () => ipcRenderer.invoke('closeWindow'),
  minimizeWindow: () => ipcRenderer.invoke('minimizeWindow'),
  maximizeWindow: () =>ipcRenderer.invoke('maximizeWindow'),
  restoreWindow: () => ipcRenderer.invoke('restoreWindow'),
  isMaximized: ()=>ipcRenderer.invoke('isMaximized'),
  getGlobal: getGlobal
})