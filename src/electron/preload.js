const { contextBridge, ipcRenderer } = require('electron')
// const {BrowserWindow, getCurrentWindow, getGlobal} = require( "@electron/remote");


contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
})

/**

contextBridge.exposeInMainWorld('sketchyAPI', {
    send: () => {}, // ipcRenderer.send,
    sendSync: () => {}, // ipcRenderer.sendSync,
    on: () => {}, // ipcRenderer.on,
    removeAllListeners: () => {}, // ipcRenderer.removeAllListeners
})
 */
/**

contextBridge.exposeInMainWorld('sketchyRemote', {
  browserWindow: BrowserWindow,
  getCurrentWindow: getCurrentWindow,
  getGlobal: getGlobal
}) */