import { autoUpdater } from "electron-updater";
import log from "electron-log";

import { store } from "../main-store";

interface Updater {
  mainWindow: any;
  init: (nightlyAllowed: boolean, disableAutoUpdate: boolean) => void;
  installUpdate: () => void;
  setUpdateSettings: (params: {
    nightlyAllowed?: boolean;
    disableAutoUpdate?: boolean;
  }) => void;
}

export const updater: Updater = {
  mainWindow: null,
  init: init,
  installUpdate: installUpdate,
  setUpdateSettings: setUpdateSettings,
};

export let forceQuitForUpdate = false;

function init(nightlyAllowed: boolean, disableAutoUpdate: boolean = false) {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.forceDevUpdateConfig = true;
  log.transports.file.level = "info";

  autoUpdater.allowPrerelease =
    nightlyAllowed || import.meta.env.VITE_BUILD_ENV !== "production";

  log.info(
    "checkForUpdatesAndNotify ---> ",
    "BULD_ENV: ",
    import.meta.env.VITE_BUILD_ENV,
    "disableAutoUpdate: ",
    disableAutoUpdate,
  );

  if (
    import.meta.env.VITE_BUILD_ENV !== "development" &&
    import.meta.env.VITE_BRANCH_NAME === "stable" &&
    !disableAutoUpdate
  ) {
    setTimeout(() => autoUpdater.checkForUpdates(), 10000); //Give time for main window to initialize
  } else {
    console.log("Checking for updates is disabled...");
  }
}

export function setUpdateSettings(params: {
  nightlyAllowed?: boolean;
  disableAutoUpdate?: boolean;
}) {
  const { nightlyAllowed, disableAutoUpdate } = params;

  let shouldCheckForUpdates = false;

  // Handle nightlyAllowed setting
  if (nightlyAllowed !== undefined) {
    let newValue =
      nightlyAllowed || import.meta.env.VITE_BUILD_ENV !== "production";
    if (autoUpdater.allowPrerelease != newValue) {
      autoUpdater.allowPrerelease = newValue;
      log.info("Nightly releases setting changed to: ", newValue);
      shouldCheckForUpdates = true;
    }
  }

  // Handle disableAutoUpdate setting
  if (disableAutoUpdate !== undefined) {
    log.info("Auto-update disabled setting changed to: ", disableAutoUpdate);

    // If auto-update is being re-enabled, we should check for updates
    if (!disableAutoUpdate) {
      shouldCheckForUpdates = true;
    }
  }

  // Trigger update check once if conditions are met
  if (
    shouldCheckForUpdates &&
    import.meta.env.VITE_BUILD_ENV !== "development" &&
    import.meta.env.VITE_BRANCH_NAME === "stable" &&
    !store.get("disableAutoUpdate")
  ) {
    log.info("Triggering update check...");
    autoUpdater.checkForUpdates();
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
    releaseNotes: info.releaseNotes,
    releaseName: info.releaseName,
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
  forceQuitForUpdate = true;
  autoUpdater.quitAndInstall();
}
