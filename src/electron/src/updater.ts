import { autoUpdater } from "electron-updater";
import log from "electron-log";

import buildVariables from "../../../buildVariables.json";
import { store } from "../main-store";

interface Updater {
  mainWindow: any;
  init: (boolean) => void;
  installUpdate: () => void;
  setNightlyAllowed: (boolean) => void;
}

export const updater: Updater = {
  mainWindow: null,
  init: init,
  installUpdate: installUpdate,
  setNightlyAllowed: setNightlyAllowed,
};

function init(nightlyAllowed: boolean) {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.forceDevUpdateConfig = true;
  log.transports.file.level = "info";

  autoUpdater.allowPrerelease =
    nightlyAllowed || buildVariables.BUILD_ENV !== "production";

  log.info(
    "checkForUpdatesAndNotify ---> ",
    "BULD_ENV: ",
    buildVariables.BUILD_ENV
  );

  if (
    buildVariables.BUILD_ENV !== "development" &&
    buildVariables.BRANCH_NAME === "stable"
  ) {
    setTimeout(() => autoUpdater.checkForUpdates(), 10000); //Give time for main window to initialize
  } else {
    console.log("Checking for updates is disabled...");
  }
}

export function setNightlyAllowed(isAllowed: boolean) {
  let newValue = isAllowed || buildVariables.BUILD_ENV !== "production";
  if (autoUpdater.allowPrerelease != newValue) {
    autoUpdater.allowPrerelease = newValue;
    if (
      buildVariables.BUILD_ENV !== "development" &&
      buildVariables.BRANCH_NAME === "stable"
    ) {
      autoUpdater.checkForUpdates();
    }
  }
}

autoUpdater.on("error", (error) => {
  log.info("Error..", error);
  updater.mainWindow.webContents.send("onAppUpdate", {
    code: "update-error",
    error: error,
  });
});

function installUpdate() {
  autoUpdater.downloadUpdate();
}

autoUpdater.on("update-available", (info) => {
  log.info("update-available...", info);
  // Prompt the user to confirm the update
  updater.mainWindow.webContents.send("onAppUpdate", {
    code: "update-available",
    version: info.version,
  });
});

autoUpdater.on("download-progress", (progressObj) => {
  log.info("update_progress", progressObj);
  updater.mainWindow.webContents.send("onAppUpdate", {
    code: "update-progress",
    percent: progressObj.percent,
  });
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("update downloaded...!");
  updater.mainWindow.webContents.send("onAppUpdate", {
    code: "update-downloaded",
  });
});

export function restartAfterUpdate() {
  updater.mainWindow.setClosable(true);
  // temporary solution, so we can quit the app for reinstall
  store.set("alwaysRunInTheBackground", false);
  autoUpdater.quitAndInstall();
}
