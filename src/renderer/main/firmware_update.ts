import JSZip from "jszip";

const CORS_PROXY = "https://api.cors.lol/?url=";

let status = "";

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
    const proxyUrl = CORS_PROXY + encodeURIComponent(zipUrl);
    const response = await fetch(proxyUrl);
    const arrayBuffer = await response.arrayBuffer();

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
    await writable.write(data);
    await writable.close();

    status = `Saved ${filename}!`;
  } catch (error) {
    if (error.name !== "AbortError") {
      status = `Save error: ${error.message}`;
    }
  }
}
