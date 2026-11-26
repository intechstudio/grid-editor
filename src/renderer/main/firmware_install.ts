import { writable } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store";
import { Analytics } from "../runtime/analytics.js";
import {
  getGridRecommendedFirmwareUrl,
  fetchAndExtract,
  isMultiarchGroup,
} from "./firmware_update.ts";

const configuration = window.ctxProcess.configuration();

// Shared by the firmware update panel and the notification bar, which both
// offer the Release / Nightly install buttons.
export const bootloaderInfo = writable<{
  version: string | undefined;
  isOutdatedD51: boolean;
}>({ version: undefined, isOutdatedD51: false });

// When the main process's bootloader detection service will give up, or
// undefined while it isn't running. Subscribed at app level (this module is
// imported by the always-mounted notification bar) so that a search started
// while a module was still connected is not missed by the dialog.
export const bootloaderDetectionEndsAt = writable<number | undefined>(
  undefined,
);

window.electron.firmware.onBootloaderDetection?.(
  (_event, { active, durationMs }) => {
    bootloaderDetectionEndsAt.set(active ? Date.now() + durationMs : undefined);
  },
);

// When the user last pressed a "Reboot to ... bootloader" button in the UI
// (FirmwareMismatchOverlay). Lets the notification bar tell "the module is
// rebooting" apart from "the module was just unplugged".
export const bootloaderRebootRequestedAt = writable<number | undefined>(
  undefined,
);

export async function checkBootloaderVersion() {
  const result = await window.electron.firmware.findBootloaderPathNative();
  bootloaderInfo.set({
    version: result?.bootloaderVersion,
    isOutdatedD51:
      result?.architecture === "d51" &&
      result?.bootloaderVersion !==
        configuration.BOOTLOADER_GRID_D51_REQUIRED_VERSION,
  });
}

export async function installFirmware(nightly: boolean = false) {
  try {
    // Set state to downloading immediately
    appSettings.update((s) => {
      s.firmwareNotificationState = 4;
      return s;
    });

    // Check if bootloader is connected
    let result = await window.electron.firmware.findBootloaderPathNative();
    if (result === undefined) {
      appSettings.update((s) => {
        s.firmwareNotificationState = 6;
        return s;
      });
      return;
    }
    const { product, architecture, bootloaderVersion } = result;
    bootloaderInfo.update((i) => ({ ...i, version: bootloaderVersion }));

    if (
      architecture === "d51" &&
      bootloaderVersion !== configuration.BOOTLOADER_GRID_D51_REQUIRED_VERSION
    ) {
      bootloaderInfo.update((i) => ({ ...i, isOutdatedD51: true }));
      appSettings.update((s) => {
        s.firmwareNotificationState = 3;
        return s;
      });
      return;
    }

    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        message: "Firmware Download Start",
      },
      mandatory: false,
    });

    // Determine the firmware URL
    let link = undefined;
    switch (product) {
      case "grid":
        if (nightly) {
          link = configuration.FIRMWARE_GRID_NIGHTLY_URL;
        } else {
          link = getGridRecommendedFirmwareUrl(architecture);
        }
        break;
      case "knot":
        link = configuration.FIRMWARE_KNOT_RELEASE_URL;
        break;
    }

    if (!link) {
      appSettings.update((s) => {
        s.firmwareNotificationState = 6;
        return s;
      });
      return;
    }

    // Download and extract firmware in the frontend
    const uf2Files = await fetchAndExtract(link);

    // Find the correct firmware file based on product and architecture
    let firmwareFile = null;
    const useMultiarch = product === "grid" && isMultiarchGroup();

    for (const file of uf2Files) {
      const filename = file.filename.toLowerCase();

      if (product === "grid") {
        if (
          useMultiarch &&
          filename.includes("multiarch") &&
          filename.includes("grid")
        ) {
          firmwareFile = file;
          break;
        } else if (
          !useMultiarch &&
          architecture === "esp32" &&
          filename.includes("esp32") &&
          filename.includes("grid")
        ) {
          firmwareFile = file;
          break;
        } else if (
          !useMultiarch &&
          architecture === "d51" &&
          filename.includes("d51") &&
          filename.includes("grid")
        ) {
          firmwareFile = file;
          break;
        } else if (
          !useMultiarch &&
          architecture === "rp2350" &&
          filename.includes("rp2350") &&
          filename.includes("grid")
        ) {
          firmwareFile = file;
          break;
        }
      } else if (product === "knot") {
        if (filename.includes("knot")) {
          firmwareFile = file;
          break;
        }
      }
    }

    if (!firmwareFile) {
      console.error("Could not find matching firmware file", {
        product,
        architecture,
        uf2Files,
      });
      appSettings.update((s) => {
        s.firmwareNotificationState = 6;
        return s;
      });
      return;
    }

    // Send firmware data to backend for writing to bootloader
    await window.electron.firmware.writeFirmwareToBootloader(
      Array.from(firmwareFile.data),
      firmwareFile.filename,
    );

    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        message: "Firmware Download Finished",
        filename: firmwareFile.filename,
      },
      mandatory: false,
    });
  } catch (error) {
    console.error("Firmware download error:", error);
    appSettings.update((s) => {
      s.firmwareNotificationState = 6;
      return s;
    });
  }
}
