import nodeDiskInfo from "node-disk-info";

import drivelist from "drivelist";

import log from "electron-log";
import fs from "fs-extra";
import path from "path";
import os from "os";

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

/**
 * Find bootloader path using pure Node.js (no native dependencies)
 * Alternative to findBootloaderPath() that doesn't require drivelist
 */
export async function findBootloaderPathNative() {
  const platform = os.platform();
  let potentialPaths: string[] = [];

  // Build list of potential mount points based on OS
  if (platform === "win32") {
    // Windows: Check all drive letters A-Z
    potentialPaths = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .map((letter) => `${letter}:\\`);

    log.info("Scanning Windows drive letters for bootloader...");
  }
  else if (platform === "darwin") {
    // macOS: Check /Volumes directory
    try {
      const volumes = await fs.readdir("/Volumes");
      potentialPaths = volumes.map((vol) => `/Volumes/${vol}`);
      log.info(`Scanning ${volumes.length} volumes on macOS for bootloader...`);
    } catch (error) {
      log.warn("Could not read /Volumes:", error.message);
    }
  }
  else {
    // Linux: Check /media and /mnt
    try {
      const username = os.userInfo().username;
      const mediaPath = `/media/${username}`;

      // Check /media/username
      if (await fs.pathExists(mediaPath)) {
        const mediaMounts = await fs.readdir(mediaPath);
        potentialPaths.push(...mediaMounts.map((m) => path.join(mediaPath, m)));
      }

      // Check /mnt
      if (await fs.pathExists("/mnt")) {
        const mntMounts = await fs.readdir("/mnt");
        potentialPaths.push(...mntMounts.map((m) => path.join("/mnt", m)));
      }

      // Also check /run/media/username (common on newer Linux distros)
      const runMediaPath = `/run/media/${username}`;
      if (await fs.pathExists(runMediaPath)) {
        const runMounts = await fs.readdir(runMediaPath);
        potentialPaths.push(...runMounts.map((m) => path.join(runMediaPath, m)));
      }

      log.info(`Scanning ${potentialPaths.length} mount points on Linux for bootloader...`);
    } catch (error) {
      log.warn("Could not read mount points:", error.message);
    }
  }

  // Check each potential path for INFO_UF2.TXT
  for (const mountPath of potentialPaths) {
    try {
      const infoPath = path.join(mountPath, "INFO_UF2.TXT");

      // Try to read the UF2 info file
      const data = await fs.readFile(infoPath, { encoding: "utf8" });

      log.info(`Found INFO_UF2.TXT at ${mountPath}`);

      // Identify Grid D51 bootloader
      if (data.indexOf("SAMD51N20A-GRID") !== -1) {
        log.info(`Grid D51 bootloader detected at ${mountPath}`);
        firmware.mainWindow.webContents.send("onFirmwareUpdate", {
          message: "Grid D51 bootloader is detected!",
          code: 3,
          path: mountPath,
        });
        return { path: mountPath, architecture: "d51", product: "grid" };
      }

      // Identify Grid ESP32 bootloader
      else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Grid") !== -1) {
        log.info(`Grid ESP32 bootloader detected at ${mountPath}`);
        firmware.mainWindow.webContents.send("onFirmwareUpdate", {
          message: "Grid ESP32 bootloader is detected!",
          code: 3,
          path: mountPath,
        });
        return { path: mountPath, architecture: "esp32", product: "grid" };
      }

      // Identify Knot ESP32 bootloader
      else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Knot") !== -1) {
        log.info(`Knot ESP32 bootloader detected at ${mountPath}`);
        firmware.mainWindow.webContents.send("onFirmwareUpdate", {
          message: "Knot ESP32 bootloader is detected!",
          code: 3,
          path: mountPath,
        });
        return { path: mountPath, architecture: "esp32", product: "knot" };
      }

      // INFO_UF2.TXT exists but not a Grid/Knot device
      else {
        log.debug(`Found UF2 device at ${mountPath} but not Grid/Knot`);
      }
    } catch (error) {
      // Path doesn't exist, not accessible, or not a UF2 device - skip silently
      // This is expected for most drives, so we don't log it
      continue;
    }
  }

  log.info("No Grid/Knot bootloader found");
  return undefined;
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
