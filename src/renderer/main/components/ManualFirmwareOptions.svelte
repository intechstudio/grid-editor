<script lang="ts">
  import FirmwareDownloadOption from "./FirmwareDownloadOption.svelte";
  import {
    getGridRecommendedFirmwareUrl,
    getGridRecommendedVersion,
  } from "../firmware_update.ts";

  const configuration = window.ctxProcess.configuration();
</script>

<FirmwareDownloadOption
  title={`Grid D51 Recommended (${getGridRecommendedVersion("d51")})`}
  downloadUrl={getGridRecommendedFirmwareUrl("d51")}
  fileFilter={(file) => file.filename.startsWith("grid_d51")}
/>

<FirmwareDownloadOption
  title={`Grid ESP32 Recommended (${getGridRecommendedVersion("esp32")})`}
  downloadUrl={getGridRecommendedFirmwareUrl("esp32")}
  fileFilter={(file) => file.filename.startsWith("grid_esp32")}
/>

<FirmwareDownloadOption
  title="Grid Release (Latest)"
  downloadUrl={configuration.FIRMWARE_GRID_RELEASE_URL}
  fileLabel={(filename) =>
    filename.startsWith("grid_d51") ? filename + " (Legacy)" : filename}
/>

<FirmwareDownloadOption
  title="Grid Nightly"
  downloadUrl={configuration.FIRMWARE_GRID_NIGHTLY_URL}
  fileLabel={(filename) =>
    filename.startsWith("grid_d51") ? filename + " (Legacy)" : filename}
/>

<FirmwareDownloadOption
  title="Knot Release (Latest)"
  downloadUrl={configuration.FIRMWARE_KNOT_RELEASE_URL}
/>

<FirmwareDownloadOption
  title="Knot Nightly"
  downloadUrl={configuration.FIRMWARE_KNOT_NIGHTLY_URL}
/>
