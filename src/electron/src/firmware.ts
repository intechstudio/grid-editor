import nodeDiskInfo from "node-disk-info";
import log from "electron-log";
import fs from "fs-extra";

import { extractArchiveToTemp, downloadInMainProcess } from "./library";
import { googleAnalytics, influxAnalytics } from "./analytics";

export const firmware = {
  mainWindow: undefined,
};

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time);
  });
}

export async function findBootloaderPath() {
  let diskInfo = undefined;

  try {
    diskInfo = nodeDiskInfo.getDiskInfoSync();
  } catch (error) {
    log.warn(error);
  }

  if (diskInfo === undefined) {
    return;
  }

  // log.info(diskInfo)
  // 7929 MAC ||  15867 new
  // 3965 for Linux and 4059648 for Windows (old bootloader)
  // 7934 for Linux and 8123904 for Windows (new bootloader)

  let gridDrive = diskInfo.find(
    (a) =>
      // old bootloader Linux Mac Win
      a.blocks === 3965 ||
      a.blocks === 7929 ||
      a.blocks === 4059648 ||
      // new bootloader Linux, Mac, M1Mac, Win
      a.blocks === 7934 ||
      a.blocks === 15867 ||
      a.blocks === 15868 ||
      a.blocks === 8123904 ||
      // add esp32 bootloader block size here LINUX & M1 Mac & WINDOWS
      a.blocks === 32640 ||
      a.blocks === 65281 ||
      a.blocks === 33423360
  );

  //console.log("DiskInfo", diskInfo)

  let data;

  if (gridDrive !== undefined) {
    try {
      data = fs.readFileSync(gridDrive.mounted + "/INFO_UF2.TXT", {
        encoding: "utf8",
        flag: "r",
      });
    } catch (error) {
      console.warn(error);
    }
  }

  if (data !== undefined) {
    // is it grid
    if (data.indexOf("SAMD51N20A-GRID") !== -1) {
      firmware.mainWindow.webContents.send("onFirmwareUpdate", {
        message: "Grid D51 bootloader is detected!",
        code: 3,
        path: gridDrive.mounted,
      });
      return { path: gridDrive.mounted, architecture: "d51", product: "grid" };
    } else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Grid") !== -1) {
      firmware.mainWindow.webContents.send("onFirmwareUpdate", {
        message: "Grid ESP32 bootloader is detected!",
        code: 3,
        path: gridDrive.mounted,
      });
      return {
        path: gridDrive.mounted,
        architecture: "esp32",
        product: "grid",
      };
    } else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Knot") !== -1) {
      firmware.mainWindow.webContents.send("onFirmwareUpdate", {
        message: "Knot ESP32 bootloader is detected!",
        code: 3,
        path: gridDrive.mounted,
      });
      return {
        path: gridDrive.mounted,
        architecture: "esp32",
        product: "knot",
      };
    }
  }
}

export async function firmwareDownload(targetFolder) {
  const result = await findBootloaderPath();

  if (typeof result === "undefined") {
    //bootloader not found
    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Error: No device connected.",
      code: 6,
    });
    return;
  }

  let path = result.path;

  googleAnalytics("firmware-download", { value: "update start" });
  influxAnalytics(
    "application",
    "firmwarecheck",
    "firmware update status",
    "update started"
  );

  let link =
    process.env.FIRMWARE_GRID_URL_BEGINING + process.env.FIRMWARE_GRID_URL_END;

  if (result.product === "knot") {
    link =
      process.env.FIRMWARE_KNOT_URL_BEGINING +
      process.env.FIRMWARE_KNOT_URL_END;
  }

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Downloading firmware image...",
    code: 4,
  });

  const downloadResult = await downloadInMainProcess(link, "temp");

  const filePathArray = await extractArchiveToTemp(
    downloadResult,
    ".uf2",
    targetFolder
  );

  await delay(1000);

  //console.log("filePathArray", filePathArray);

  let firmwareFileName = undefined;

  if (result.product === "grid") {
    filePathArray.forEach((element) => {
      if (element.indexOf(result.architecture) !== -1) {
        firmwareFileName = element;
        console.log("Correct firmware is: ", firmwareFileName);
      }
    });
  } else if (result.product === "knot") {
    filePathArray.forEach((element) => {
      if (element.indexOf("knot") !== -1) {
        firmwareFileName = element;
        console.log("Correct firmware is: ", firmwareFileName);
      }
    });
  } else {
    //unknown product
  }

  if (firmwareFileName === undefined) {
    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Error: Download failed.",
      code: 3,
    });

    googleAnalytics("firmware-download", { value: "download fail" });
    influxAnalytics(
      "application",
      "firmwarecheck",
      "firmware update status",
      "download fail"
    );

    return;
  }

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Decompressing image...",
    code: 4,
  });

  await delay(1500);

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Uploading firmware...",
    code: 4,
  });

  await delay(1500);

  if (path !== undefined) {
    try {
      fs.copySync(
        targetFolder + "/temp/" + firmwareFileName,
        path + "/" + firmwareFileName
      );
    } catch (error) {
      console.log("COPY ERROR UNBOUNT", error);
    }

    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Update completed successfully!",
      code: 5,
    });

    googleAnalytics("firmware-download", { value: "update success" });
    influxAnalytics(
      "application",
      "firmwarecheck",
      "firmware update status",
      "update success"
    );
  } else {
    log.warn("GRID_NOT_FOUND");

    googleAnalytics("firmware-download", { value: "update fail" });
    influxAnalytics(
      "application",
      "firmwarecheck",
      "firmware update status",
      "update fail"
    );
  }
}
