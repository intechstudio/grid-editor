import nodeDiskInfo from "node-disk-info";

import drivelist from "drivelist";

import log from "electron-log";
import fs from "fs-extra";

import { extractArchiveToTemp, downloadInMainProcess } from "./library";

export const firmware = {
  mainWindow: undefined,
};

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({}), time);
  });
}

export async function findBootloaderPath() {
  let diskInfo: drivelist.Drive[] = [];

  try {
    diskInfo = await drivelist.list();
  } catch (error) {
    log.warn(error);
  }

  if (diskInfo === undefined) {
    return;
  }

  let gridDrives = diskInfo.filter(
    (a) => a.size < 64 * 1024 * 1024 && a.isUSB && !a.isSystem && !a.isReadOnly,
  );
  if (gridDrives.length === 0) return;

  for (const gridDrive of gridDrives) {
    if (gridDrive.mountpoints.length == 0) continue;

    let mountPath = gridDrive.mountpoints[0].path;
    let data: string;
    try {
      data = fs.readFileSync(mountPath + "/INFO_UF2.TXT", {
        encoding: "utf8",
        flag: "r",
      });
    } catch (error) {
      console.warn(error);
    }
    if (data === undefined) continue;

    // is it grid
    if (data.indexOf("SAMD51N20A-GRID") !== -1) {
      firmware.mainWindow.webContents.send("onFirmwareUpdate", {
        message: "Grid D51 bootloader is detected!",
        code: 3,
        path: mountPath,
      });
      return { path: mountPath, architecture: "d51", product: "grid" };
    } else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Grid") !== -1) {
      firmware.mainWindow.webContents.send("onFirmwareUpdate", {
        message: "Grid ESP32 bootloader is detected!",
        code: 3,
        path: mountPath,
      });
      return {
        path: mountPath,
        architecture: "esp32",
        product: "grid",
      };
    } else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Knot") !== -1) {
      firmware.mainWindow.webContents.send("onFirmwareUpdate", {
        message: "Knot ESP32 bootloader is detected!",
        code: 3,
        path: mountPath,
      });
      return {
        path: mountPath,
        architecture: "esp32",
        product: "knot",
      };
    }
  }
}

export async function firmwareDownload(targetFolder, product, arch, url) {
  const { path } = await findBootloaderPath();

  if (path === undefined) {
    //bootloader not found
    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Error: No device connected.",
      code: 6,
    });
    return;
  }

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Downloading firmware image...",
    code: 4,
  });

  const downloadResult = await downloadInMainProcess(url, "temp");

  console.log(downloadResult);

  let firmwareFileName = undefined;

  if (url.endsWith(".zip")) {
    const filePathArray = await extractArchiveToTemp(
      downloadResult,
      ".uf2",
      targetFolder,
    );

    if (product === "grid") {
      filePathArray.forEach((element) => {
        if (element.indexOf(arch) !== -1) {
          firmwareFileName = element;
          console.log("Correct firmware is: ", firmwareFileName);
        }
      });
    } else if (product === "knot") {
      filePathArray.forEach((element) => {
        if (element.indexOf("knot") !== -1) {
          firmwareFileName = element;
          console.log("Correct firmware is: ", firmwareFileName);
        }
      });
    } else {
      //unknown product
    }
  } else {
    const lastSlashIndex = downloadResult.lastIndexOf("\\");
    if (lastSlashIndex !== -1) {
      firmwareFileName = downloadResult.slice(lastSlashIndex + 1);
    } else {
      firmwareFileName = downloadResult.split("/").pop();
    }

    console.log("Nightly URL: ", url);
    console.log("Nightly file name: ", firmwareFileName);
  }

  if (firmwareFileName === undefined) {
    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Error: Download failed.",
      code: 3,
    });

    return;
  }

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Decompressing image...",
    code: 4,
  });

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Uploading firmware...",
    code: 4,
  });

  try {
    fs.copySync(
      targetFolder + "/temp/" + firmwareFileName,
      path + "/" + firmwareFileName,
    );
  } catch (error) {
    console.log("COPY ERROR UNBOUND", error);

    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Bootloader connection lost!",
      code: 6,
    });
    return;
  }

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Update completed successfully!",
    code: 5,
  });
}
