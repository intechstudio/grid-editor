import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  clipboard,
  shell,
  MessageChannelMain
} from "electron";
import path from "path";
import log from "electron-log";
import fs from "fs";
import { autoUpdater } from "electron-updater";
import { spawn } from "child_process";

// might be environment variables as well.
import configuration from "../../configuration.json";
import buildVariables from "../../buildVariables.json";

configuration.EDITOR_VERSION = app.getVersion();

console.log(buildVariables, configuration);

import { serial, restartSerialCheckInterval } from "./ipcmain_serialport";
import { websocket } from "./ipcmain_websocket";
import { store } from "./main-store";
import { iconBuffer, iconSize } from "./icon";
import { firmware, firmwareDownload, findBootloaderPath } from "./src/firmware";
import { updater, restartAfterUpdate } from "./src/updater";
import {
  libraryDownload,
  uxpPhotoshopDownload,
  selectDirectory,
} from "./src/library";
import {
  loadConfigsFromDirectory,
  moveOldConfigs,
  saveConfig,
  updateConfig,
  updateLocal,
  deleteConfig,
  migrateToProfileCloud,
} from "./src/profiles";
import { sendToDiscord } from "./src/discord";
import { fetchUrlJSON } from "./src/fetch";
import { getLatestVideo } from "./src/youtube";
import {
  desktopAutomationPluginStart,
  desktopAutomationPluginStop,
} from "./addon/desktopAutomation";
import { Deeplink } from "electron-deeplink";
import { setPluginManagerMessagePort } from "./plugin/pluginManager";

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

log.info("App starting...");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// To avoid context aware flag.
//app.allowRendererProcessReuse = false;

let tray = null;

function create_tray() {
  /* ===============================================================================
// Conde snippet to generate JSON file from PNG. Use this when creating a new icon
// ./icon.js holds de raw data in PNG encoding

  let iconLoad = fs.readFileSync(path.join(__dirname, './icon.png'),null)
  const iconLoadJson = JSON.stringify(iconLoad);
  fs.writeFileSync(path.join(__dirname, './iconpng.txt'), iconLoadJson)  
*/

  const icon = nativeImage.createFromBuffer(Buffer.from(iconBuffer.data), {
    width: iconSize,
    height: iconSize,
  });

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: function () {
        mainWindow.setSkipTaskbar(false);
        mainWindow.show();

        mainWindow.webContents.send("trayState", false);
      },
    },
    {
      label: "Hide",
      click: function () {
        mainWindow.hide();
        mainWindow.setSkipTaskbar(true);

        mainWindow.webContents.send("trayState", true);
      },
    },
    {
      label: "Exit",
      click: function () {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Grid Editor");
  tray.setContextMenu(contextMenu);
  tray.setTitle("Grid Editor");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on(
    "second-instance",
    (event, commandLine, workingDirectory, additionalData) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (process.platform !== "darwin") {
          mainWindow.show();
        }

        if (mainWindow.isMinimized()) {
          mainWindow.restore();
          mainWindow.focus();
        }
      }
    }
  );

  app.whenReady().then(() => {
    if (process.platform !== "darwin") {
      create_tray();
    }
    createWindow();
  });
}

// We should be able to set the dock icon and menu name of the app, but it doesnt work
// app.on('ready', () => {
//   app.setName('Grid Editor')
// })

function createWindow() {
  const windowTitle = "Grid Editor - " + configuration.EDITOR_VERSION;

  // First we'll get our height and width. This will be the defaults if there wasn't anything saved
  let { width, height } = store.get("windowBounds");

  mainWindow = new BrowserWindow({
    width,
    height,
    minHeight: 500,
    minWidth: 800,
    backgroundColor: "#1e2628",
    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: {
      x: 6,
      y: 6,
    },
    title: windowTitle,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
    icon: "./icon.png",
  });

  // We set an intercept on incoming requests to disable x-frame-options
  // headers.
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    { urls: ["*://*/*"] },
    (d, c) => {
      if (d.responseHeaders["X-Frame-Options"]) {
        delete d.responseHeaders["X-Frame-Options"];
      } else if (d.responseHeaders["x-frame-options"]) {
        delete d.responseHeaders["x-frame-options"];
      }

      c({ cancel: false, responseHeaders: d.responseHeaders });
    }
  );

  serial.mainWindow = mainWindow;
  websocket.mainWindow = mainWindow;

  firmware.mainWindow = mainWindow;

  updater.mainWindow = mainWindow;

  ipcMain.on("restartAfterUpdate", () => {
    restartAfterUpdate();
  });

  console.log("here what is buildVariables.BUILD_ENV");
  if (buildVariables.BUILD_ENV === "development") {
    log.info("Development Mode!");
    mainWindow.loadURL("http://localhost:5173/");
    mainWindow.webContents.openDevTools();
  } else {
    // this is applicable for any non development environment, like production or test
    log.info(
      "Production Mode!",
      `file://${path.join(__dirname, "../../dist/renderer/index.html")}`
    );
    mainWindow.loadURL(
      `file://${path.join(__dirname, "../../dist/renderer/index.html")}`
    );
  }

  mainWindow.on("close", (evt) => {
    // when quit is terminal under darwin
    if (app.quitting) {
      mainWindow = null;
    } else {
      // only hide, keep in the background
      evt.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("resize", () => {
    let { width, height } = mainWindow.getBounds();

    store.set("windowBounds", { width, height });
    mainWindow.webContents.send("window_size", { width, height });
  });

  mainWindow.webContents.session.on(
    "select-serial-port",
    (event, portList, webContents, callback) => {
      event.preventDefault();
      if (portList && portList.length > 0) {
        callback(portList[0].portId);
      } else {
        callback(""); //Could not find any matching devices
      }
    }
  );

  mainWindow.webContents.session.on("serial-port-added", (event, port) => {
    log.info("serial-port-added FIRED WITH", port);
  });

  mainWindow.webContents.session.on("serial-port-removed", (event, port) => {
    log.info("serial-port-removed FIRED WITH", port);
  });

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      // file is for production, localhost is for development, mind the last '/' at the end of the url
      if (
        permission === "serial" &&
        (details.securityOrigin == "file:///" ||
          details.securityOrigin == "http://localhost:5173/")
      ) {
        return true;
      }
    }
  );

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    // file is for production, localhost is for development
    if (
      details.deviceType === "serial" &&
      (details.origin === "file://" ||
        details.origin === "http://localhost:5173")
    ) {
      return true;
    }
  });

  // Handle plugin configuration, action
  mainWindow.webContents.on("did-finish-load", () => {
    const {port1, port2} = new MessageChannelMain()
    setPluginManagerMessagePort(port2)
    mainWindow.webContents.postMessage('plugin-manager-port', null, [port1])
  })
}

// isDev is only true when we are in development mode. nightly builds are not development as they are packaged and path resolution is different
const isDev = buildVariables.BUILD_ENV == "development" ? true : false;
const deeplink = new Deeplink({
  app,
  mainWindow,
  protocol: "grid-editor",
  isDev,
  debugLogging: true,
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

autoUpdater.checkForUpdatesAndNotify();

deeplink.on("received", (data) => {
  if (data.startsWith("grid-editor")) {
    const url = new URL(data);
    if (url.searchParams.get("credential") !== null) {
      const credential = url.searchParams.get("credential");
      mainWindow.webContents.send("onExternalAuthResponse", credential);
    }
    if (url.searchParams.get("profile-link") !== null) {
      const profileLink = url.searchParams.get("profile-link");
      mainWindow.webContents.send("onExternalProfileLinkResponse", profileLink);
    }
  }
});

ipcMain.handle("clipboardWriteText", async (event, arg) => {
  console.log(arg.text);
  clipboard.writeText(arg.text);
});

ipcMain.handle("download", async (event, arg) => {
  let result: any = undefined;
  if (arg.packageToDownload == "library") {
    result = await libraryDownload(arg.targetFolder);
  }
  if (arg.packageToDownload == "uxpPhotoshop") {
    result = await uxpPhotoshopDownload(arg.targetFolder);
  }
  return result;
});

ipcMain.handle("selectDirectory", async (event, arg) => {
  return await selectDirectory();
});

ipcMain.handle("viewDirectory", async (event, arg) => {
  shell.openPath(arg.targetFolder);
  return;
});

ipcMain.handle("resetDirectory", async (event, arg) => {
  const defaultPath = app.getPath("documents") + "/grid-userdata";
  // Create the folder if it does not exist
  if (!fs.existsSync(defaultPath)) {
    fs.mkdirSync(defaultPath);
  }
  return defaultPath;
});

ipcMain.handle("defaultDirectory", (event, arg) => {
  const defaultPath = app.getPath("documents") + "/grid-userdata";
  return defaultPath;
});

ipcMain.handle("moveOldConfigs", async (event, arg) => {
  return await moveOldConfigs(arg.configPath, arg.rootDirectory);
});

ipcMain.handle("loadConfigsFromDirectory", async (event, arg) => {
  return await loadConfigsFromDirectory(arg.configPath, arg.rootDirectory);
});

ipcMain.handle("migrateToProfileCloud", async (event, arg) => {
  return await migrateToProfileCloud(arg.oldPath, arg.newPath);
});

ipcMain.handle("saveConfig", async (event, arg) => {
  return await saveConfig(
    arg.configPath,
    arg.name,
    arg.config,
    arg.rootDirectory,
    arg.user
  );
});

ipcMain.handle("updateConfig", async (event, arg) => {
  return await updateConfig(
    arg.configPath,
    arg.name,
    arg.config,
    arg.rootDirectory,
    arg.oldName,
    arg.profileFolder
  );
});

ipcMain.handle("updateLocal", async (event, arg) => {
  return await updateLocal(
    arg.configPath,
    arg.name,
    arg.config,
    arg.rootDirectory,
    arg.profileFolder
  );
});

ipcMain.handle("deleteConfig", async (event, arg) => {
  return await deleteConfig(
    arg.configPath,
    arg.name,
    arg.rootDirectory,
    arg.profileFolder
  );
});

// this is needed for the functions to have the mainWindow for communication
ipcMain.handle("firmwareDownload", async (event, arg) => {
  return await firmwareDownload(arg.targetFolder);
});
ipcMain.handle("findBootloaderPath", async (event, arg) => {
  return await findBootloaderPath();
});

ipcMain.handle("restartSerialCheckInterval", (event, arg) => {
  return restartSerialCheckInterval();
});

ipcMain.handle("sendToDiscord", async (event, arg) => {
  console.log("sendTOdiscord", arg.message);
  return await sendToDiscord(arg.message);
});

ipcMain.handle("fetchUrlJSON", (event, arg) => {
  return fetchUrlJSON(arg);
});

// load the latest video from the grid editor playlist
ipcMain.handle("getLatestVideo", async (event, arg) => {
  return await getLatestVideo();
});

// launch browser and open url
ipcMain.handle("openInBrowser", async (event, arg) => {
  return await shell.openExternal(arg.url);
});

// persistent storage for the app
ipcMain.handle("getPersistentStore", (event, arg) => {
  let result = {};
  arg.forEach((key) => {
    let value = store.get(key);
    result[key] = value;
  });
  return result;
});

ipcMain.handle("setPersistentStore", (event, arg) => {
  Object.entries(arg).forEach((entry) => {
    let [key, value] = entry;
    if (value !== undefined) {
      store.set(arg);
      log.info("attempt to store..", arg);
    } else {
      store.delete(key);
      log.info("delete from store..", arg);
    }
  });
  return "saved";
});
// app window management
ipcMain.handle("closeWindow", async (event, args) => {
  mainWindow.close();
  return "closed";
});

ipcMain.handle("minimizeWindow", async (event, args) => {
  mainWindow.minimize();
});

ipcMain.handle("maximizeWindow", async (event, args) => {
  mainWindow.maximize();
});

ipcMain.handle("restoreWindow", async (event, args) => {
  mainWindow.restore();
});

ipcMain.handle("isMaximized", async (event, args) => {
  return mainWindow.isMaximized();
});

// configuration variables
ipcMain.on("getConfiguration", (event) => {
  event.returnValue = configuration;
});

// build variables
ipcMain.on("getBuildVariables", (event) => {
  event.returnValue = buildVariables;
});

ipcMain.on("get-app-path", (event) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on("analytics_uuid", (event) => {
  event.returnValue = store.get("userId");
});

ipcMain.on("app_version", (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on("resetAppSettings", (event, arg) => {
  log.info("Clear app settings...");
  store.clear();

  if (process.env.APPIMAGE) {
    let options;
    options.args = process.argv.slice(1).concat(["--relaunch"]);
    options.execPath = process.execPath;
    options.execPath = process.env.APPIMAGE;
    options.args.unshift("--appimage-extract-and-run");
    log.info("ARGS: ", options);
    app.relaunch(options);
    app.exit(0);
  } else {
    app.relaunch();
    app.exit();
  }

  return true;
});

ipcMain.on("restartApp", (event, arg) => {
  log.info("main", "App restart requested");

  if (process.env.APPIMAGE) {
    let options;
    options.args = process.argv.slice(1).concat(["--relaunch"]);
    options.execPath = process.execPath;
    options.execPath = process.env.APPIMAGE;
    options.args.unshift("--appimage-extract-and-run");
    log.info("ARGS: ", options);
    app.relaunch(options);
    app.exit(0);
  } else {
    app.relaunch();
    app.exit();
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", (evt) => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  mainWindow.show();
});

// termination of application, closing the windows, used for macOS hide flag
app.on("before-quit", () => (app.quitting = true));
