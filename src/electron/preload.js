const { contextBridge, ipcRenderer } = require('electron')
const { getGlobal } = require( "@electron/remote");


contextBridge.exposeInMainWorld('ctxProcess', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  platform: () => process.platform,
  env: () => ipcRenderer.invoke('get-env')
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('electron', {
  library: {
    download: (targetFolder, package) => ipcRenderer.invoke('download', {targetFolder, package}),
    viewDirectory: (targetFolder) => ipcRenderer.invoke('viewDirectory', {targetFolder}),
    selectDirectory: () => ipcRenderer.invoke('selectDirectory'),
    resetDirectory: () => ipcRenderer.invoke('resetDirectory'),
    defaultDirectory: () => ipcRenderer.invoke('defaultDirectory'),
  },
  firmware: {
    onFirmwareUpdate: (callback) => ipcRenderer.on('onFirmwareUpdate', callback),
    findBootloaderPath: () => ipcRenderer.invoke('findBootloaderPath'),
    firmwareDownload: (targetFolder) => ipcRenderer.invoke('firmwareDownload', {targetFolder}),
  },
  configs: {
    moveOldConfigs: (configPath,rootDirectory) => ipcRenderer.invoke('moveOldConfigs', {configPath, rootDirectory}),
    loadConfigsFromDirectory: (configPath, rootDirectory) => ipcRenderer.invoke('loadConfigsFromDirectory', {configPath, rootDirectory}),
    saveConfig: (configPath, name, config, rootDirectory) => ipcRenderer.invoke('saveConfig', {configPath, name, config, rootDirectory}),
  },
  resetAppSettings: () => ipcRenderer.sendSync('resetAppSettings'),
  persistentStorage: {
    get: (request) => ipcRenderer.invoke('getPersistentStore', request),
    set: (object) => ipcRenderer.invoke('setPersistentStore', object),
  }
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
  isMaximized: () => ipcRenderer.invoke('isMaximized'),
  getGlobal: () => getGlobal
})