import JSZip from "jszip";

const CORS_PROXY = "https://api.cors.lol/?url=";

let status = "";

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

    // Extract ESP32 and D51 files using pattern matching

    for (const [path, file] of Object.entries(zip.files)) {
      if (!file.dir) {
        const filename = path.split("/").pop(); // Get just the filename
        if (filename.endsWith(".uf2")) {
          uf2_files.push({ data: file, filename: filename });
        }
      }
    }

    if (!esp32File && !d51File) {
      throw new Error("Neither grid_esp32_*.uf2 nor grid_d51_*.uf2 found");
    }

    if (esp32File) {
      esp32Data = await esp32File.async("uint8array");
    }

    if (d51File) {
      d51Data = await d51File.async("uint8array");
    }

    status = `Success! Found ${esp32File ? esp32FileName : ""}${esp32File && d51File ? " and " : ""}${d51File ? d51FileName : ""}`;
  } catch (error) {
    status = `Error: ${error.message}`;
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
