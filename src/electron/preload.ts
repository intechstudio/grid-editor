const { contextBridge, ipcRenderer } = require("electron");

// contextBridge exposed processes from NodeJs
contextBridge.exposeInMainWorld("ctxProcess", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  platform: () => process.platform,
  env: () => ipcRenderer.sendSync("get-env"),
  // we can also expose variables, not just functions
});

contextBridge.exposeInMainWorld("electron", {
  appPath: () => ipcRenderer.sendSync("get-app-path"),
  auth: {
    onExternalResponse: (callback) =>
      ipcRenderer.on("onExternalAuthResponse", callback),
  },
  library: {
    download: (targetFolder, packageToDownload) =>
      ipcRenderer.invoke("download", { targetFolder, packageToDownload }),
    viewDirectory: (targetFolder) =>
      ipcRenderer.invoke("viewDirectory", { targetFolder }),
    selectDirectory: () => ipcRenderer.invoke("selectDirectory"),
    resetDirectory: () => ipcRenderer.invoke("resetDirectory"),
    defaultDirectory: () => ipcRenderer.invoke("defaultDirectory"),
  },
  firmware: {
    onFirmwareUpdate: (callback) =>
      ipcRenderer.on("onFirmwareUpdate", callback),
    findBootloaderPath: () => ipcRenderer.invoke("findBootloaderPath"),
    firmwareDownload: (targetFolder, arch, product) =>
      ipcRenderer.invoke("firmwareDownload", { targetFolder }),
  },
  serial: {
    restartSerialCheckInterval: () =>
      ipcRenderer.invoke("restartSerialCheckInterval"),
  },
  configs: {
    moveOldConfigs: (configPath, rootDirectory) =>
      ipcRenderer.invoke("moveOldConfigs", { configPath, rootDirectory }),
    loadConfigsFromDirectory: (configPath, rootDirectory) =>
      ipcRenderer.invoke("loadConfigsFromDirectory", {
        configPath,
        rootDirectory,
      }),
    saveConfig: (configPath, name, config, rootDirectory, user) =>
      ipcRenderer.invoke("saveConfig", {
        configPath,
        name,
        config,
        rootDirectory,
        user,
      }),
    updateConfig: (
      configPath,
      name,
      config,
      rootDirectory,
      oldName,
      profileFolder
    ) =>
      ipcRenderer.invoke("updateConfig", {
        configPath,
        name,
        config,
        rootDirectory,
        oldName,
        profileFolder,
      }),
    deleteConfig: (configPath, name, rootDirectory, profileFolder) =>
      ipcRenderer.invoke("deleteConfig", {
        configPath,
        name,
        rootDirectory,
        profileFolder,
      }),
  },
  resetAppSettings: () => ipcRenderer.sendSync("resetAppSettings"),
  getLatestVideo: () => ipcRenderer.invoke("getLatestVideo"),
  openInBrowser: (url) => ipcRenderer.invoke("openInBrowser", { url }),
  fetchUrlJSON: (url) => ipcRenderer.invoke("fetchUrlJSON", url),
  restartApp: () => ipcRenderer.sendSync("restartApp"),
  updater: {
    restartAfterUpdate: () => ipcRenderer.sendSync("restartAfterUpdate"),
    onAppUpdate: (callback) => ipcRenderer.on("onAppUpdate", callback),
  },
  discord: {
    sendMessage: (message) => ipcRenderer.invoke("sendToDiscord", { message }),
  },
  analytics: {
    google: (name, params) =>
      ipcRenderer.invoke("googleAnalytics", { name, params }),
    influx: (category, action, label, value) =>
      ipcRenderer.invoke("influxAnalytics", { category, action, label, value }),
  },
  persistentStorage: {
    get: (request) => ipcRenderer.invoke("getPersistentStore", request),
    set: (object) => ipcRenderer.invoke("setPersistentStore", object),
  },
  window: {
    close: () => ipcRenderer.invoke("closeWindow"),
    minimize: () => ipcRenderer.invoke("minimizeWindow"),
    maximize: () => ipcRenderer.invoke("maximizeWindow"),
    restore: () => ipcRenderer.invoke("restoreWindow"),
    isMaximized: () => ipcRenderer.invoke("isMaximized"),
  },
  activeWindow: () => ipcRenderer.invoke("activeWindow"),
  websocket: {
    onReceive: (callback) => ipcRenderer.on("onWebsocketReceive", callback),
    onTransmit: (callback) => ipcRenderer.on("onWebsocketTransmit", callback),
    transmit: (message) => ipcRenderer.invoke("websocketTransmit", { message }),
    changePort: (port) => ipcRenderer.invoke("websocketChangePort", { port }),
  },
  plugin: {
    start: (name) => ipcRenderer.invoke("startPlugin", { name }),
    stop: (name) => ipcRenderer.invoke("stopPlugin", { name }),
  },
});
