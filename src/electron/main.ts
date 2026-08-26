import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  shell,
  MessageChannelMain,
  utilityProcess,
  screen,
  protocol,
  net,
  nativeTheme,
} from "electron";
import path from "path";
import log from "electron-log";
import fs from "fs";
import chokidar from "chokidar";

// might be environment variables as well.
import configuration from "../../configuration.json";


function isManagedLinuxPackage(): boolean {
  // Flatpak: `container=flatpak` is set for every flatpak'd process;
  // /.flatpak-info is the filesystem fallback.
  const isFlatpak =
    process.env.container === "flatpak" || fs.existsSync("/.flatpak-info");

  // Snap: snapd exports SNAP (mount dir) and SNAP_NAME for confined apps.
  const isSnap = !!process.env.SNAP && !!process.env.SNAP_NAME;

  return isFlatpak || isSnap;
}

// Add custom transport to forward logs to renderer DevTools console
function setupRendererLogTransport() {
  // @ts-ignore - custom transport
  log.transports.renderer = (message) => {
    // Only send if mainWindow exists and is not destroyed
    if (mainWindow && !mainWindow.isDestroyed()) {
      const logLevel = message.level;
      const logData = message.data;
      const scope = message.scope ? `[${message.scope}]` : "";

      // Map electron-log levels to console methods
      const consoleMethod = logLevel === 'error' ? 'error' :
        logLevel === 'warn' ? 'warn' :
          logLevel === 'debug' ? 'debug' :
            'log';

      // Format the message with [ELECTRON] prefix to distinguish from renderer logs
      const prefix = `[ELECTRON]${scope ? " " + scope : ""}`;

      // Execute console log in the renderer's DevTools
      const args = logData.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // Inject the log into renderer's console
      mainWindow.webContents.executeJavaScript(
        `console.${consoleMethod}(${JSON.stringify(prefix)}, ${JSON.stringify(args)})`
      ).catch(() => {
        // Silently fail if window is closing
      });
    }
  };
}

configuration.EDITOR_VERSION = app.getVersion();
configuration.EDITOR_NAME = app.getName();

log.info(
  "NAME: ",
  configuration.EDITOR_NAME,
  " VERSION: ",
  configuration.EDITOR_VERSION,
);

import { serial, restartSerialCheckInterval } from "./ipcmain_serialport";
import { websocket } from "./ipcmain_websocket";
import { developerWebsocket } from "./developer_websocket";
import { startLuaLSServer, stopLuaLSServer } from "./ipcmain_luals";
import { store } from "./main-store";
import { iconBuffer, iconSize } from "./icon";
import { firmware, findBootloaderPathNative, writeFirmwareToBootloader } from "./src/firmware";
import { updater, restartAfterUpdate, forceQuitForUpdate } from "./src/updater";
import {
  libraryDownload,
  uxpPhotoshopDownload,
  selectDirectory,
} from "./src/library";
import {
  loadConfigsFromDirectory,
  saveConfig,
  deleteConfig,
  migrateToProfileCloud,
} from "./src/profiles";
import { fetchReleaseNotes, fetchUrlJSON } from "./src/fetch";
import { getLatestVideo } from "./src/youtube";

log.info("App starting...");
log.info("BUILD ENVS:", import.meta.env);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Bootloader detection service state
let bootloaderDetectionTimeout: NodeJS.Timeout | null = null;
let bootloaderDetectionRunning = false;

/**
 * Get bootloader VID/PID pairs from configuration
 * @returns Array of bootloader device definitions
 */
function getBootloaderPairs() {
  return [
    {
      vid: parseInt(configuration.BOOTLOADER_GRID_D51_VID, 16),
      pid: parseInt(configuration.BOOTLOADER_GRID_D51_PID, 16),
      name: "Grid D51",
    },
    {
      vid: parseInt(configuration.BOOTLOADER_GRID_ESP32_VID, 16),
      pid: parseInt(configuration.BOOTLOADER_GRID_ESP32_PID, 16),
      name: "Grid ESP32",
    },
    {
      vid: parseInt(configuration.BOOTLOADER_GRID_RP2350_VID, 16),
      pid: parseInt(configuration.BOOTLOADER_GRID_RP2350_PID, 16),
      name: "Grid RP2350",
    },
    {
      vid: parseInt(configuration.BOOTLOADER_KNOT_VID, 16),
      pid: parseInt(configuration.BOOTLOADER_KNOT_PID, 16),
      name: "Knot",
    },
  ];
}

/**
 * Check if a serial port is a bootloader device
 * @param port - Serial port to check
 * @returns Bootloader info if match found, undefined otherwise
 */
function isBootloaderPort(port: Electron.SerialPort) {
  const bootloaderPairs = getBootloaderPairs();

  // Port VID/PID are decimal strings, convert to numbers for comparison
  const portVid = parseInt(port.vendorId, 10);
  const portPid = parseInt(port.productId, 10);

  return bootloaderPairs.find((pair) => {
    return portVid === pair.vid && portPid === pair.pid;
  });
}

/**
 * Start the bootloader detection service
 * Checks for bootloader drive repeatedly until found or timeout
 */
function startBootloaderDetectionService() {
  if (bootloaderDetectionRunning) {
    log.info("Bootloader detection service already running");
    return;
  }

  log.info("Starting bootloader detection service...");
  bootloaderDetectionRunning = true;

  let delay = 1000;
  let totalDelay = 0;

  async function retryFind() {
    if (!bootloaderDetectionRunning) return;

    let result = await findBootloaderPathNative();

    if (result) {
      log.info("Bootloader drive detected successfully, stopping service");
      stopBootloaderDetectionService();
      return;
    }

    totalDelay += delay;
    if (totalDelay > 8000) {
      log.info("Bootloader detection timeout reached");
      stopBootloaderDetectionService();
      return;
    }

    bootloaderDetectionTimeout = setTimeout(retryFind, delay);
  }

  bootloaderDetectionTimeout = setTimeout(retryFind, delay);
}

/**
 * Stop the bootloader detection service
 */
function stopBootloaderDetectionService() {
  if (!bootloaderDetectionRunning) {
    return;
  }

  log.info("Stopping bootloader detection service");
  bootloaderDetectionRunning = false;

  if (bootloaderDetectionTimeout) {
    clearTimeout(bootloaderDetectionTimeout);
    bootloaderDetectionTimeout = null;
  }
}

// To avoid context aware flag.
//app.allowRendererProcessReuse = false;

let tray = null;

let packageManagerProcess: Electron.UtilityProcess | undefined = undefined;

protocol.registerSchemesAsPrivileged([
  { scheme: "package", privileges: { bypassCSP: true, standard: true } },
]);

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("grid-editor", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("grid-editor");
}

// Single, reliable way to bring the window back to the foreground, no matter
// how it was hidden (minimized, tray/dock, or never shown after a "taskbar"/
// "tray" startup). This is the escape hatch from every hidden startup state:
// the tray menu/icon, a relaunch (see "second-instance"), and macOS dock
// activation all route through here.
function showMainWindow() {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.setSkipTaskbar(false);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("trayState", false);
}

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
      click: showMainWindow,
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

  // Clicking the tray icon (single click on Windows, double click elsewhere) is
  // the most discoverable way back to a window hidden in the tray.
  tray.on("click", showMainWindow);
  tray.on("double-click", showMainWindow);
}

const gotTheLock = app.requestSingleInstanceLock();

// Set up global handler for all web contents to open external links in browser
app.on('web-contents-created', (event, contents) => {
  // Handle window.open() and target="_blank" links
  contents.setWindowOpenHandler(({ url }) => {
    // Open http/https links in external browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    // Deny opening new windows within the app
    return { action: 'deny' };
  });

  // Handle regular <a> tag clicks and navigation attempts
  contents.on('will-navigate', (event, navigationUrl) => {
    const url = new URL(navigationUrl);

    // Allow file:// protocol (for production builds)
    if (url.protocol === 'file:') {
      return;
    }

    // Allow localhost (for development)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return;
    }

    // Block and open external http/https links in browser
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});

function handleDeeplinkReturnData(returnData: string) {
  const url = new URL(returnData);
  if (url.searchParams.get("credential") !== null) {
    const credential = url.searchParams.get("credential");
    mainWindow.webContents.send("onExternalAuthResponse", credential);
  }
  if (url.searchParams.get("config-link") !== null) {
    const configLink = url.searchParams.get("config-link");
    mainWindow.webContents.send("onExternalConfigLinkResponse", configLink);
  }
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on(
    "second-instance",
    (event, commandLine, workingDirectory, additionalData) => {
      // Someone tried to run a second instance — restore and focus our window.
      // Covers both a minimized window and one hidden to the tray/dock (e.g.
      // when launched with the "taskbar" or "tray" startup window state).
      if (mainWindow) {
        showMainWindow();

        // Only treat the last arg as a deeplink when it actually is a URL;
        // a plain relaunch passes a file path that new URL() would reject.
        const lastArg = commandLine.pop()?.toString();
        if (lastArg && lastArg.includes("://")) {
          handleDeeplinkReturnData(lastArg);
        }
      }
    },
  );

  app.whenReady().then(() => {
    //Migration logic
    if (store.get("lastActiveVersion") === undefined) {
      console.log(
        `Starting migration from ${store.get("lastActiveVersion")} to ${configuration.EDITOR_VERSION}`,
      );
      let enabledPackages: string[] = store.get("enabledPackages") ?? [];
      let newEnabledPackages = [
        ...enabledPackages,
        "midi-monitor",
        "debug-monitor",
      ];
      store.set("enabledPackages", newEnabledPackages);
      store.set("lastActiveVersion", configuration.EDITOR_VERSION);
    }

    // Ensure built-in packages that should always be present are enabled
    const alwaysEnabled = ["file-manager"];
    let enabledPackages: string[] = store.get("enabledPackages") ?? [];
    const missing = alwaysEnabled.filter((id) => !enabledPackages.includes(id));
    if (missing.length > 0) {
      store.set("enabledPackages", [...enabledPackages, ...missing]);
    }

    if (process.platform !== "darwin") {
      create_tray();
    }
    createApplicationMenu();
    createWindow();
    protocol.handle("package", (req) => {
      let requestPath = req.url.substring("package://".length);

      // import() calls are cached client side
      // To bust through, clients may send url starting with 'vxxx/'
      if (requestPath.startsWith("v")) {
        requestPath = requestPath.split("/").slice(1).join("/");
      }

      let packageName = requestPath.split("/")[0];
      let filePath = requestPath.split("/").slice(1).join("/");
      let packageFolder = path.resolve(
        path.join(
          app.getPath("documents"),
          "grid-userdata",
          "packages",
          packageName,
        ),
      );

      // Override package path for local dev packages
      let localPackages = store.get("localPackages");
      if (localPackages[packageName]) {
        packageFolder = localPackages[packageName];
      }
      const fullPath = path.join(packageFolder, filePath);
      return net.fetch(`file://${fullPath}`);
    });
  });
}

// Handle the protocol deeplink url under MacOS.
app.on("open-url", (event, url) => {
  handleDeeplinkReturnData(url);
});

// The window is frameless with a custom Titlebar.svelte, so Electron's
// default application menu would otherwise stay active but invisible —
// including Reload/Force Reload accelerators that silently re-read the
// preload script from disk. Building an explicit menu here both makes the
// available shortcuts discoverable and lets us control what "restart" does:
// in dev, `electron-vite dev --watch` supervises this process as a child,
// so a real `app.relaunch()+app.exit()` (see `restartApp`) would kill the
// whole dev server — a soft `webContents.reload()` is used there instead.
function createApplicationMenu() {
  const isDev = import.meta.env.VITE_BUILD_ENV === "development";

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Restart",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => {
            if (isDev) {
              mainWindow?.webContents.reload();
            } else {
              restartApp();
            }
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// We should be able to set the dock icon and menu name of the app, but it doesnt work
// app.on('ready', () => {
//   app.setName('Grid Editor')
// })

function createWindow() {
  // Match the title text shown in Titlebar.svelte.
  const windowTitle =
    `Grid Editor ${configuration.EDITOR_VERSION}` +
    (import.meta.env.VITE_BUILD_ENV === "nightly"
      ? ` ${import.meta.env.VITE_BRANCH_NAME}`
      : "") +
    (import.meta.env.VITE_BUILD_ENV === "development"
      ? ` ${import.meta.env.VITE_BUILD_ENV}`
      : "");

  // First we'll get our height and width. This will be the defaults if there wasn't anything saved
  let { width, height } = store.get("windowBounds");

  mainWindow = new BrowserWindow({
    width,
    height,
    // Create hidden; we decide whether to show or start minimized once the
    // content is ready to render (avoids a white flash on normal launch).
    show: false,
    minHeight: 500,
    minWidth: 800,
    backgroundColor: "#1e2628",
    frame: true,
    title: windowTitle,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
    icon: "./icon.png",
  });

  // Fully hidden, not just auto-hide (which would still let Alt reveal it) —
  // the menu's entries and accelerators (File > Restart, View > Reload, …)
  // stay registered and working either way.
  mainWindow.setMenuBarVisibility(false);

  // Without this, Electron overwrites `windowTitle` with the loaded page's
  // own <title> (index.html has a generic "Editor") once it finishes
  // loading, via `page-title-updated`.
  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault();
  });

  // Decide how the window appears on launch (see "Startup window state" in
  // preferences). A second launch always restores + focuses the window (see the
  // "second-instance" handler), so a tray/minimized start stays recoverable.
  mainWindow.once("ready-to-show", () => {
    switch (store.get("startupWindowState")) {
      case "tray":
        // "Open hidden in the tray" is only offered on Windows (see the
        // Preferences radio): macOS has no tray and many Linux desktops lack a
        // system tray, where hiding would make the app unreachable. Honour the
        // setting only on Windows; on any other platform a stale/synced "tray"
        // value falls through to a normal window so the app can't get stuck
        // hidden with no way back.
        if (process.platform === "win32") {
          mainWindow.setSkipTaskbar(true);
          mainWindow.webContents.send("trayState", true);
          // The tray icon is easy to miss (Windows hides new icons in the
          // overflow area), so tell the user where the window went.
          if (tray) {
            tray.displayBalloon({
              title: "Grid Editor",
              content:
                "Grid Editor is running in the background. Click the tray icon to open its window.",
            });
          }
        } else {
          mainWindow.show();
        }
        break;
      case "taskbar":
        // Linux compositors (e.g. Wayland/GNOME) won't map a window that was
        // never shown, so it has to be shown before it can be minimized. On
        // Windows/macOS calling show() first makes the window flash on screen
        // for a frame before minimizing, so there we minimize the still-hidden
        // window directly.
        if (process.platform === "linux") {
          mainWindow.show();
        }
        mainWindow.minimize();
        break;
      default:
        mainWindow.show();
    }
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
    },
  );

  serial.mainWindow = mainWindow;
  websocket.mainWindow = mainWindow;
  firmware.mainWindow = mainWindow;
  updater.mainWindow = mainWindow;

  updater.init(
    store.get("nightlyEditor"),
    store.get("disableAutoUpdate") || isManagedLinuxPackage(),
  );

  // Start LuaLS WebSocket bridge for Monaco LSP
  startLuaLSServer();

  // Setup custom log transport to forward logs to renderer
  setupRendererLogTransport();

  // Check for bootloader and trigger detection
  mainWindow.webContents.session.on("serial-port-added", (event, port) => {
    log.info("Serial port added:", port);

    // Check if this port is a bootloader
    const bootloaderInfo = isBootloaderPort(port);

    if (bootloaderInfo) {
      log.info(`Found ${bootloaderInfo.name} bootloader`);
      startBootloaderDetectionService();
    }
  });

  mainWindow.webContents.session.on("serial-port-removed", (event, port) => {
    log.info("Serial port removed:", port);
  });

  setTimeout(findBootloaderPathNative, 10000); // Initial check

  ipcMain.on("restartAfterUpdate", () => {
    log.info('Calling "restartAfterUpdate" from main.ts');
    restartAfterUpdate();
  });

  ipcMain.on("restartPackageManager", (event) => {
    restartPackageManagerProcess();
  });

  ipcMain.on("installUpdate", (event) => {
    updater.installUpdate();
  });

  console.log(`here what is VITE_BUILD_ENV: ${import.meta.env.VITE_BUILD_ENV}`);
  if (import.meta.env.VITE_BUILD_ENV === "development") {
    log.info("Development Mode!");
    mainWindow.loadURL("http://localhost:5273/");
    mainWindow.webContents.openDevTools();
  } else {
    // this is applicable for any non development environment, like production or test
    log.info(
      "Production Mode!",
      `file://${path.join(__dirname, "../../dist/renderer/index.html")}`,
    );
    mainWindow.loadURL(
      `file://${path.join(__dirname, "../../dist/renderer/index.html")}`,
    );
  }

  mainWindow.on("close", async (evt) => {
    // when quit is terminal under darwin
    if (app.quitting) {
      mainWindow = null;
    } else {
      evt.preventDefault();
      // only hide, keep in the background
      if (forceQuitForUpdate) {
        app.quit();
      } else if (store.get("alwaysRunInTheBackground")) {
        mainWindow.hide();
      } else if (packageManagerProcess) {
        packageManagerProcess!.postMessage({ type: "query-running-packages" });
      } else {
        app.quit();
      }
    }
  });

  ipcMain.on("quitDialogResult", (_event, value) => {
    if (value === "quit") {
      app.quit();
    } else if (value === "tray") {
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
    },
  );

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      // file is for production, localhost is for development, mind the last '/' at the end of the url
      if (
        permission === "serial" &&
        (details.securityOrigin == "file:///" ||
          details.securityOrigin == "http://localhost:5273/")
      ) {
        return true;
      }
    },
  );

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    // file is for production, localhost is for development
    if (
      details.deviceType === "serial" &&
      (details.origin === "file://" ||
        details.origin === "http://localhost:5273")
    ) {
      return true;
    }
  });
  // Handle package configuration, action
  mainWindow.webContents.on("did-finish-load", () => {
    const { port1, port2 } = new MessageChannelMain();
    mainWindow.webContents.postMessage("package-manager-port", null, [port1]);
    packageEditorPort = port2;
    port2.on("message", (e) => {
      packageManagerProcess?.postMessage(e.data, e.ports);
    });
    port2.start();
    restartPackageManagerProcess();
  });
}

let stopPackageManagerTimeout = undefined;
let restartPackageManagerOnShutdown = true;
let packageEditorPort = undefined;
let packageManagerCachedData = undefined;
function startPackageManager(
  updatePackageOnStartName: string | undefined = undefined,
) {
  const packageFolder = path.resolve(
    path.join(app.getPath("documents"), "grid-userdata", "packages"),
  );
  if (!packageManagerProcess) {
    packageManagerProcess = utilityProcess.fork(
      path.resolve(path.join(__dirname, "./packageManager.js")),
    );

    packageManagerProcess.on("message", (message) => {
      if (message.type == "create-window") {
        createPackageWindow(message);
      } else if (message.type == "close-window") {
        closePackageWindow(message.windowId);
      } else if (message.type == "shutdown-complete") {
        clearTimeout(stopPackageManagerTimeout);
        packageManagerProcess?.kill();
        packageManagerProcess = undefined;
        if (restartPackageManagerOnShutdown) {
          startPackageManager();
        }
      } else if (
        message.type === "delete-package-folder" ||
        message.type === "update-package-folder"
      ) {
        packageManagerProcess?.once("exit", () => {
          fs.rm(message.path, { recursive: true }, () =>
            startPackageManager(message.packageName),
          );
        });
        packageManagerProcess!.kill();
        packageManagerProcess = undefined;
      } else if (message.type === "running-packages-result") {
        if (message.hasRunningPackage) {
          mainWindow.webContents.send("showQuitDialog");
        } else {
          app.quit();
        }
      } else if (message.type === "cache-temp-data") {
        packageManagerCachedData = message.data;
      } else {
        packageEditorPort?.postMessage(message);
      }
    });

    packageManagerProcess.postMessage({
      type: "init",
      packageFolder: packageFolder,
      version: configuration.EDITOR_VERSION,
      githubPackages: store.get("githubPackages"),
      localPackages: store.get("localPackages"),
      updatePackageOnStartName,
      cachedData: packageManagerCachedData,
    });

    for (const _package of store.get("enabledPackages") ?? []) {
      packageManagerProcess.postMessage({
        type: "load-package",
        id: _package,
        payload: store.get("packagesDataStorage")[_package],
      });
    }
  }
}

function stopPackageManager(stopGracefully: boolean = false) {
  if (!stopGracefully) {
    packageManagerProcess?.kill();
    packageManagerProcess = undefined;
  } else {
    packageManagerProcess.postMessage({ type: "stop-package-manager" });
    stopPackageManagerTimeout = setTimeout(() => {
      packageManagerProcess?.kill();
      packageManagerProcess = undefined;
      if (restartPackageManagerOnShutdown) {
        startPackageManager();
      }
    }, 10000);
  }
}

function handleDeveloperWebsocketMessage(data: any) {
  if (data.type === "developer-package") {
    let developerPackages = store.get("localPackages");
    if (
      developerPackages[data.id] &&
      path.resolve(developerPackages[data.id]) === path.resolve(data.rootPath)
    ) {
      if (data.event === "components-build-complete") {
        packageEditorPort?.postMessage({
          type: "reload-package-components",
          id: data.id,
        });
      } else if (data.event === "package-build-complete") {
        packageManagerProcess?.postMessage({
          type: "restart-package",
          id: data.id,
          payload: store.get("packagesDataStorage")[data.id],
        });
      }
    } else {
      packageEditorPort?.postMessage({
        type: "request-developer-package",
        id: data.id,
        rootPath: data.rootPath,
        name:
          data.name ??
          data.id
            .split("-")
            .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
            .join(" "),
      });
    }
  }
}

let openWindows: Map<String, BrowserWindow> = new Map();
function createPackageWindow(args) {
  const windowId = args.windowId;
  if (openWindows.has(windowId)) {
    if (args.recreateIfExists) {
      closePackageWindow(windowId);
    } else {
      console.log(`Window with id: ${windowId} already exists!`);
      return;
    }
  }

  let { width, height } = screen.getPrimaryDisplay().workAreaSize;
  if (!args.fullscreen) {
    width = args.width;
    height = args.height;
  }

  const window = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    resizable: args.resizable,
    transparent: args.transparent,
    alwaysOnTop: args.alwaysOnTop,
    title: args.title ?? `Grid Editor - ${windowId}`,
    x: args.x ?? 0,
    y: args.y ?? 0,
    webPreferences: {
      backgroundThrottling: false,
      preload: path.join(__dirname, "../preload/package.js"),
    },
  });

  window.loadURL(args.windowFile);
  if (args.ignoreMouse) {
    window.setIgnoreMouseEvents(true, { forward: false });
  }

  openWindows.set(windowId, window);

  let messageChannel = new MessageChannelMain();
  window.webContents.postMessage("package-port", { windowId }, [
    messageChannel.port1,
  ]);
  packageManagerProcess?.postMessage(
    {
      id: args.packageId,
      type: "create-package-message-port",
      senderId: windowId,
    },
    [messageChannel.port2],
  );
  window.show();
}
function closePackageWindow(windowId) {
  let window = openWindows.get(windowId);
  if (window) {
    openWindows.delete(windowId);
    window.close();
  }
}

async function restartPackageManagerProcess() {
  restartPackageManagerOnShutdown = true;
  if (packageManagerProcess) {
    stopPackageManager(true);
  } else {
    startPackageManager();
  }
}

if (store.get("packageDeveloper")) {
  developerWebsocket.startWebsocketServer(handleDeveloperWebsocketMessage);
}

store.onDidChange("packageDeveloper", (newValue) => {
  if (newValue) {
    developerWebsocket.startWebsocketServer(handleDeveloperWebsocketMessage);
  } else {
    developerWebsocket.stopWebsocketServer();
  }
});

store.onDidChange("nightlyEditor", (newValue) => {
  updater.setUpdateSettings({ nightlyAllowed: newValue });
});

store.onDidChange("disableAutoUpdate", (newValue) => {
  updater.setUpdateSettings({ disableAutoUpdate: newValue });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

let configWatcher: chokidar.FSWatcher | undefined;
function startConfigWatcher(configPath, rootDirectory) {
  configWatcher?.close();

  async function sendLocalConfigs() {
    try {
      var result = await loadConfigsFromDirectory(configPath, rootDirectory);
      mainWindow.webContents.send("sendConfigsToRenderer", result);
    } catch (e) {
      log.error("Failed to load local configs:", e);
    }
  }

  configWatcher = chokidar.watch(path.join(configPath, "configs"), {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true, // Ignore initial events on startup
    depth: 0, // Only watch the top-level directory
  });
  configWatcher.on("add", function (path) {
    sendLocalConfigs();
  });
  configWatcher.on("change", function (path) {
    sendLocalConfigs();
  });
  configWatcher.on("unlink", function (path) {
    sendLocalConfigs();
  });
  configWatcher.on("ready", function () {
    sendLocalConfigs();
  });
  sendLocalConfigs();
}

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
  const normalizedPath = path.normalize(arg.targetFolder); // handle mixed '/' and '\' characters on windows
  shell.openPath(normalizedPath);
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

ipcMain.handle("loadConfigsFromDirectory", async (event, arg) => {
  return await loadConfigsFromDirectory(arg.configPath, arg.rootDirectory);
});

ipcMain.handle("migrateToProfileCloud", async (event, arg) => {
  return await migrateToProfileCloud(
    arg.oldRootPath,
    arg.newRootPath,
    arg.configDirectory,
  );
});

ipcMain.handle("saveConfig", async (event, arg) => {
  return await saveConfig(arg.configPath, arg.rootDirectory, arg.config);
});

ipcMain.handle("startConfigsWatch", async (event, arg) => {
  return await startConfigWatcher(arg.configPath, arg.rootDirectory);
});

ipcMain.handle("stopConfigsWatch", async (event) => {
  configWatcher?.close();
  configWatcher = undefined;
});

ipcMain.handle("deleteConfig", async (event, arg) => {
  return await deleteConfig(arg.configPath, arg.rootDirectory, arg.config);
});

// this is needed for the functions to have the mainWindow for communication
ipcMain.handle("findBootloaderPathNative", async (event, arg) => {
  return await findBootloaderPathNative();
});

ipcMain.handle("writeFirmwareToBootloader", async (event, arg) => {
  // Convert the array back to Buffer
  const firmwareBuffer = Buffer.from(arg.firmwareData);
  return await writeFirmwareToBootloader(firmwareBuffer, arg.filename);
});

ipcMain.handle("fetchBinaryFile", async (event, url) => {
  try {
    log.info(`Fetching file from: ${url}`);
    const response = await net.fetch(url);

    if (!response.ok) {
      const errorMsg = `HTTP error! status: ${response.status} - URL: ${url}`;
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    const arrayBuffer = await response.arrayBuffer();
    log.info(`Successfully fetched ${arrayBuffer.byteLength} bytes from ${url}`);

    // Convert to array for IPC transfer
    return Array.from(new Uint8Array(arrayBuffer));
  } catch (error) {
    log.error(`Failed to fetch file from ${url}:`, error);
    throw error;
  }
});

ipcMain.handle("restartSerialCheckInterval", (event, arg) => {
  return restartSerialCheckInterval();
});

ipcMain.handle("fetchReleaseNotes", (event, arg) => {
  return fetchReleaseNotes();
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

ipcMain.handle(
  "setNativeTheme",
  (_event, theme: string) => {
    nativeTheme.themeSource = theme === "dark" ? "dark" : "light";
  },
);

// configuration variables
ipcMain.on("getConfiguration", (event) => {
  event.returnValue = configuration;
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
    let options = {
      args: process.argv.slice(1).concat(["--relaunch"]),
      execPath: process.env.APPIMAGE,
    };
    options.args.unshift("--appimage-extract-and-run");
    log.info("ARGS: ", options);
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch(options);
    app.exit(0);
  } else {
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
    app.exit(0);
  }

  return true;
});

function restartApp() {
  log.info("main", "App restart requested");

  if (process.env.APPIMAGE) {
    let options;
    options.args = process.argv.slice(1).concat(["--relaunch"]);
    options.execPath = process.execPath;
    options.execPath = process.env.APPIMAGE;
    options.args.unshift("--appimage-extract-and-run");
    log.info("ARGS: ", options);
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch(options);
    app.exit(0);
  } else {
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch();
    app.exit();
  }
}

ipcMain.on("restartApp", (event, arg) => {
  restartApp();
});

// Quit when all windows are closed.
app.on("window-all-closed", (evt) => {
  const keepRunning = store.get("alwaysRunInTheBackground");

  if (keepRunning === true) {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      restartPackageManagerOnShutdown = false;
      stopPackageManager();
      app.quit();
    }
  } else {
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open. This is also the
  // way back from a "tray" startup on macOS, where the window is hidden but the
  // dock icon remains.
  showMainWindow();
});

// termination of application, closing the windows, used for macOS hide flag
app.on("before-quit", (evt) => {
  log.info("before-quit evt", evt);
  stopLuaLSServer();
  app.quitting = true;
});
