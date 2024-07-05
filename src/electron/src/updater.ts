import { autoUpdater } from "electron-updater";
import { app } from "electron";
import semver from "semver";
import log from "electron-log";

import buildVariables from "../../../buildVariables.json";
import { store } from "../main-store";

interface Updater {
  mainWindow: any;
  init: () => void;
  installUpdate: () => void;
}

export const updater: Updater = {
  mainWindow: null,
  init: init,
  installUpdate: installUpdate,
};

function init() {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.forceDevUpdateConfig = true;
  log.transports.file.level = "info";

  if (buildVariables.BUILD_ENV === "production") {
    autoUpdater.channel = "latest";
  }

  if (buildVariables.BUILD_ENV === "nightly") {
    autoUpdater.channel = "latest";
  }

  if (buildVariables.BUILD_ENV === "alpha") {
    autoUpdater.channel = "alpha";
    autoUpdater.allowPrerelease = true;
  }

  const temporaryVersionCheck = semver.lte(app.getVersion(), "1.2.39");

  log.info(
    "checkForUpdatesAndNotify ---> ",
    "TEMP_CHECK: ",
    temporaryVersionCheck,
    "BULD_ENV: ",
    buildVariables.BUILD_ENV,
    " CHANNEL: ",
    autoUpdater.channel
  );

  if (
    temporaryVersionCheck ||
    buildVariables.BUILD_ENV === "alpha" ||
    buildVariables.BUILD_ENV === "production"
  ) {
    setTimeout(() => autoUpdater.checkForUpdates(), 5000); //Give time for main window to initialize
  } else {
    console.log("Checking for updates is disabled...");
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
