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
  disableUpdating: () => void;
}

export const updater: Updater = {
  mainWindow: null,
  init: init,
  installUpdate: installUpdate,
  disableUpdating: disableUpdating,
};

// URL of your GitHub repository's releases
const GITHUB_REPO_OWNER = "intechstudio";
const GITHUB_REPO_NAME = "grid-editor";
const GITHUB_RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

let updateTimeout: any = undefined;

// Function to check for updates without downloading
async function checkForUpdates() {
  console.log("Checking for update...");
  try {
    const response = await fetch(GITHUB_RELEASES_URL);
    const releaseInfo = await response.json();

    // Get the latest version from the GitHub release
    const latestVersion = releaseInfo.tag_name.replace("v", "");
    const currentVersion = app.getVersion();

    if (latestVersion !== currentVersion) {
      // An update is available, inform the user
      handleUpdateAvailable(latestVersion);
    } else {
      // No update available
      console.log("No update available.");
    }
  } catch (error) {
    console.error("Error checking for updates:", error.message);
  }
}

function init() {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = true; // Enable auto download updates in development mode
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
    updateTimeout = setTimeout(checkForUpdates, 5000);
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

function disableUpdating() {
  clearTimeout(updateTimeout);
}

function installUpdate() {
  autoUpdater.checkForUpdatesAndNotify();
}

function handleUpdateAvailable(info) {
  log.info("update-available...", info);
  // Prompt the user to confirm the update
  updater.mainWindow.webContents.send("onAppUpdate", {
    code: "update-available",
    version: info,
  });
}

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
