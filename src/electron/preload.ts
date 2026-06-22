const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ctxProcess", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  platform: () => process.platform,
  configuration: () => ipcRenderer.sendSync("getConfiguration"),
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
    onFirmwareUpdate: (callback) => {
      ipcRenderer.on("onFirmwareUpdate", callback);
      return () => ipcRenderer.removeListener("onFirmwareUpdate", callback);
    },
    findBootloaderPathNative: () =>
      ipcRenderer.invoke("findBootloaderPathNative"),
    writeFirmwareToBootloader: (firmwareData, filename) =>
      ipcRenderer.invoke("writeFirmwareToBootloader", {
        firmwareData,
        filename,
      }),
  },
  fetchBinaryFile: (url) => ipcRenderer.invoke("fetchBinaryFile", url),
  serial: {
    restartSerialCheckInterval: () =>
      ipcRenderer.invoke("restartSerialCheckInterval"),
  },
  configs: {
    migrateToProfileCloud: (oldRootPath, newRootPath, configDirectory) =>
      ipcRenderer.invoke("migrateToProfileCloud", {
        oldRootPath,
        newRootPath,
        configDirectory,
      }),
    loadConfigsFromDirectory: (configPath, rootDirectory) =>
      ipcRenderer.invoke("loadConfigsFromDirectory", {
        configPath,
        rootDirectory,
      }),
    onSendConfigsToRenderer: (callback) =>
      ipcRenderer.on("sendConfigsToRenderer", callback),
    startConfigsWatch: (configPath, rootDirectory) =>
      ipcRenderer.invoke("startConfigsWatch", { configPath, rootDirectory }),
    stopConfigsWatch: () => ipcRenderer.invoke("stopConfigsWatch"),
    saveConfig: (configPath, rootDirectory, config) => {
      return new Promise((resolve, reject) => {
        const res = ipcRenderer.invoke("saveConfig", {
          configPath,
          rootDirectory,
          config,
        });
        resolve(res);
      });
    },
    deleteConfig: (configPath, rootDirectory, config) =>
      ipcRenderer.invoke("deleteConfig", {
        configPath,
        rootDirectory,
        config,
      }),
    onExternalResponse: (callback) =>
      ipcRenderer.on("onExternalConfigLinkResponse", callback),
  },
  resetAppSettings: () => ipcRenderer.sendSync("resetAppSettings"),
  getLatestVideo: () => ipcRenderer.invoke("getLatestVideo"),
  openInBrowser: (url) => ipcRenderer.invoke("openInBrowser", { url }),
  fetchUrlJSON: (url) => ipcRenderer.invoke("fetchUrlJSON", url),
  fetchReleaseNotes: (url: string) =>
    ipcRenderer.invoke("fetchReleaseNotes", url),
  restartApp: () => ipcRenderer.sendSync("restartApp"),
  updater: {
    restartAfterUpdate: () => ipcRenderer.sendSync("restartAfterUpdate"),
    onAppUpdate: (callback) => ipcRenderer.on("onAppUpdate", callback),
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
  restartPackageManager: () => ipcRenderer.send("restartPackageManager"),
  installUpdate: () => ipcRenderer.send("installUpdate"),
  overlay: (payload) => ipcRenderer.invoke("overlay", { payload }),
  appLoaded: () => appLoadedPromiseResolve(undefined),
  showQuitDialog: (callback) => ipcRenderer.on("showQuitDialog", callback),
  quitDialogResult: (result) => ipcRenderer.send("quitDialogResult", result),
});

let appLoadedPromiseResolve: (any) => any;

const appLoaded = new Promise((resolve) => {
  appLoadedPromiseResolve = resolve;
});

ipcRenderer.on("package-manager-port", async (event) => {
  await appLoaded;
  window.postMessage("package-manager-port", "*", event.ports);
});

export {};
