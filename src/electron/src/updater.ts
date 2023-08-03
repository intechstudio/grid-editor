import { autoUpdater } from "electron-updater";
import log from "electron-log";

interface Updater {
  mainWindow: any;
}

export const updater: Updater = {
  mainWindow: null,
};

autoUpdater.channel = "latest";
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

log.info("check for update and notify...");
autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on("error", (error) => {
  log.info("Error..", error);
  updater.mainWindow.webContents.send("onAppUpdate", {
    code: "update-error",
    error: error,
  });
});

autoUpdater.on("update-available", (info) => {
  log.info("update-available...", info);
  updater.mainWindow.webContents.send("onAppUpdate", {
    code: "update-available",
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
  autoUpdater.quitAndInstall();
}
