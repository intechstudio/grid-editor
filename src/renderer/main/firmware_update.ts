import JSZip from "jszip";
import { Analytics } from "../runtime/analytics.js";

const CORS_PROXY = "https://api.cors.lol/?url=";

let status = "";

/**
 * Fetch wrapper that uses different implementations based on build target
 * - Electron build: Uses native fetch via IPC (no CORS issues)
 * - Web build: Uses CORS proxy for browser-based fetch
 * @param url - The URL to fetch
 * @returns ArrayBuffer of the fetched data
 */
async function fetchBinaryFile(url: string): Promise<ArrayBuffer> {
  const startTime = Date.now();

  try {
    let arrayBuffer: ArrayBuffer;

    if (import.meta.env.VITE_BUILD_TARGET === "web") {
      // Web build: Use CORS proxy
      const proxyUrl = CORS_PROXY + encodeURIComponent(url);
      const response = await fetch(proxyUrl);
      arrayBuffer = await response.arrayBuffer();
    } else {
      // Electron build: Use native fetch via IPC
      const uint8Array = await window.electron.fetchBinaryFile(url);
      arrayBuffer = new Uint8Array(uint8Array).buffer;
    }

    const duration = Date.now() - startTime;
    const sizeKB = Math.round(arrayBuffer.byteLength / 1024);

    Analytics.track({
      event: "File Download Success",
      payload: {
        VITE_BUILD_TARGET: import.meta.env.VITE_BUILD_TARGET,
        url,
        sizeKB,
        durationMs: duration,
      },
      mandatory: false,
    });

    return arrayBuffer;
  } catch (error) {
    const duration = Date.now() - startTime;

    Analytics.track({
      event: "File Download Failed",
      payload: {
        VITE_BUILD_TARGET: import.meta.env.VITE_BUILD_TARGET,
        url,
        error: error.message,
        durationMs: duration,
      },
      mandatory: false,
    });

    throw error;
  }
}

/**
 * Get the recommended Grid firmware URL for a specific architecture
 * @param architecture - 'esp32' or 'd51'
 * @returns URL string for the recommended firmware version
 */
export function getGridRecommendedFirmwareUrl(
  architecture: "esp32" | "d51",
): string {
  const configuration = window.ctxProcess.configuration();

  let version: string;
  if (architecture === "esp32") {
    version = `v${configuration.FIRMWARE_GRID_ESP32_REQUIRED_MAJOR}.${configuration.FIRMWARE_GRID_ESP32_REQUIRED_MINOR}.${configuration.FIRMWARE_GRID_ESP32_REQUIRED_PATCH}`;
  } else {
    version = `v${configuration.FIRMWARE_GRID_D51_REQUIRED_MAJOR}.${configuration.FIRMWARE_GRID_D51_REQUIRED_MINOR}.${configuration.FIRMWARE_GRID_D51_REQUIRED_PATCH}`;
  }

  return `${configuration.FIRMWARE_GRID_URL_BEGINING}${version}${configuration.FIRMWARE_GRID_URL_END}`;
}

/**
 * Get the recommended Grid firmware version string for a specific architecture
 * @param architecture - 'esp32' or 'd51'
 * @returns Version string (e.g., "v1.4.1")
 */
export function getGridRecommendedVersion(
  architecture: "esp32" | "d51",
): string {
  const configuration = window.ctxProcess.configuration();

  if (architecture === "esp32") {
    return `v${configuration.FIRMWARE_GRID_ESP32_REQUIRED_MAJOR}.${configuration.FIRMWARE_GRID_ESP32_REQUIRED_MINOR}.${configuration.FIRMWARE_GRID_ESP32_REQUIRED_PATCH}`;
  } else {
    return `v${configuration.FIRMWARE_GRID_D51_REQUIRED_MAJOR}.${configuration.FIRMWARE_GRID_D51_REQUIRED_MINOR}.${configuration.FIRMWARE_GRID_D51_REQUIRED_PATCH}`;
  }
}

export async function fetchAndExtract(zipUrl) {
  if (!zipUrl) {
    status = "Error: Enter ZIP URL";
    return;
  }
  let uf2_files = [];

  try {
    status = "Fetching...";
    const arrayBuffer = await fetchBinaryFile(zipUrl);

    status = "Unzipping...";
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extract all .uf2 files from the ZIP
    for (const [path, file] of Object.entries(zip.files)) {
      if (!file.dir) {
        const filename = path.split("/").pop(); // Get just the filename
        if (filename.endsWith(".uf2")) {
          const data = await file.async("uint8array");
          uf2_files.push({ data, filename });
        }
      }
    }

    if (uf2_files.length === 0) {
      return;
    }

    status = `Success! Found ${uf2_files.length} firmware file(s)`;
  } catch (error) {
    status = `Error: ${error.message}`;
    return;
  }

  return uf2_files;
}

export async function saveFile(data, filename) {
  if (!data) {
    status = "Error: No file data";
    return;
  }

  try {
    // Create blob for the binary data
    const blob = new Blob([data], { type: "application/octet-stream" });

    // In Electron, createWritable() is blocked by the sandbox even when
    // showSaveFilePicker is available — use anchor download instead.
    const isElectron = import.meta.env.VITE_BUILD_TARGET !== "web";

    if (!isElectron && window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "Binary",
            accept: { "application/octet-stream": [".uf2", ".bin"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      // Fallback for browsers without File System Access API
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    status = `Saved ${filename}!`;
  } catch (error) {
    if (error.name !== "AbortError") {
      status = `Save error: ${error.message}`;
      console.error("Save file error:", error);
    }
  }
}
