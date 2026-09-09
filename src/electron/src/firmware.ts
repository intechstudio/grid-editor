import log from "electron-log";
import fs from "fs-extra";
import path from "path";
import os from "os";

export const firmware = {
  mainWindow: undefined,
};

export type BootloaderInfo = {
  path: string;
  architecture: "d51" | "esp32" | "rp2350";
  product: "grid" | "knot";
  label: string;
};

/**
 * Send the "a bootloader was just found" UI notification. Only call this for
 * a genuinely fresh detection (see main.ts's USB-connect trigger and startup
 * check) — findBootloaderPathNative itself is a pure lookup and must not be
 * relied on to broadcast this as a side effect of being called.
 */
export function notifyBootloaderDetected(info: BootloaderInfo) {
  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: `${info.label} bootloader is detected!`,
    code: 3,
    path: info.path,
  });
}

/**
 * Find bootloader path using pure Node.js (no native dependencies).
 * Pure lookup — does not send any UI notification as a side effect.
 */
export async function findBootloaderPathNative(): Promise<
  BootloaderInfo | undefined
> {
  const platform = os.platform();
  let potentialPaths: string[] = [];

  // Build list of potential mount points based on OS
  if (platform === "win32") {
    // Windows: Check all drive letters A-Z
    potentialPaths = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .map((letter) => `${letter}:\\`);

    log.info("Scanning Windows drive letters for bootloader...");
  } else if (platform === "darwin") {
    // macOS: Check /Volumes directory
    try {
      const volumes = await fs.readdir("/Volumes");
      potentialPaths = volumes.map((vol) => `/Volumes/${vol}`);
      log.info(`Scanning ${volumes.length} volumes on macOS for bootloader...`);
    } catch (error) {
      log.warn("Could not read /Volumes:", error.message);
    }
  } else {
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
        potentialPaths.push(
          ...runMounts.map((m) => path.join(runMediaPath, m)),
        );
      }

      log.info(
        `Scanning ${potentialPaths.length} mount points on Linux for bootloader...`,
      );
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
        return {
          path: mountPath,
          architecture: "d51",
          product: "grid",
          label: "Grid D51",
        };
      }

      // Identify Grid ESP32 bootloader
      else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Grid") !== -1) {
        log.info(`Grid ESP32 bootloader detected at ${mountPath}`);
        return {
          path: mountPath,
          architecture: "esp32",
          product: "grid",
          label: "Grid ESP32",
        };
      }

      // Identify Knot ESP32 bootloader
      else if (data.indexOf("ESP32S3") !== -1 && data.indexOf("Knot") !== -1) {
        log.info(`Knot ESP32 bootloader detected at ${mountPath}`);
        return {
          path: mountPath,
          architecture: "esp32",
          product: "knot",
          label: "Knot ESP32",
        };
      }

      // Identify RP2350 bootloader (stock RP2350 ROM UF2 bootloader, no "Grid" marker in INFO_UF2.TXT)
      else if (data.indexOf("RP2350") !== -1) {
        log.info(`Generic RP2350 bootloader detected at ${mountPath}`);
        return {
          path: mountPath,
          architecture: "rp2350",
          product: "grid",
          label: "Generic RP2350",
        };
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

/**
 * Write firmware data directly to the bootloader path
 * @param firmwareData - Uint8Array of firmware data
 * @param filename - Name of the firmware file
 * @returns success boolean
 */
export async function writeFirmwareToBootloader(
  firmwareData: Buffer,
  filename: string,
) {
  const result = await findBootloaderPathNative();

  if (result === undefined) {
    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Error: No device connected.",
      code: 6,
    });
    throw new Error("No bootloader found");
  }

  const { path } = result;

  firmware.mainWindow.webContents.send("onFirmwareUpdate", {
    message: "Uploading firmware...",
    code: 4,
  });

  try {
    const targetPath = path + "/" + filename;
    log.info(
      `Writing firmware file: ${filename} to bootloader at: ${targetPath}`,
    );
    log.info(`Firmware data size: ${firmwareData.length} bytes`);

    fs.writeFileSync(targetPath, firmwareData);

    log.info(`Successfully wrote firmware file: ${filename}`);

    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Update completed successfully!",
      code: 5,
    });

    return true;
  } catch (error) {
    log.error("Failed to write firmware:", error);
    firmware.mainWindow.webContents.send("onFirmwareUpdate", {
      message: "Bootloader connection lost!",
      code: 6,
    });
    throw error;
  }
}
