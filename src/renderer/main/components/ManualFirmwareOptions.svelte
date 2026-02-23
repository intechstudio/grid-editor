<script lang="ts">
  import FirmwareDownloadOption from "./FirmwareDownloadOption.svelte";
  import {
    getGridRecommendedFirmwareUrl,
    getGridRecommendedVersion,
  } from "../firmware_update.ts";
  import { appSettings } from "../../runtime/app-helper.store";

  const configuration = window.ctxProcess.configuration();
</script>

<FirmwareDownloadOption
  title={`Grid S2-S3 (ESP32) Recommended (${getGridRecommendedVersion("esp32")})`}
  downloadUrl={getGridRecommendedFirmwareUrl("esp32")}
  fileFilter={(file) => file.filename.startsWith("grid_esp32")}
/>

<FirmwareDownloadOption
  title={`Grid S1 (D51) Recommended (${getGridRecommendedVersion("d51")})`}
  downloadUrl={getGridRecommendedFirmwareUrl("d51")}
  fileFilter={(file) => file.filename.startsWith("grid_d51")}
/>

{#if $appSettings.persistent.nightlyFirmware}
  <FirmwareDownloadOption
    title="Grid Nightly"
    downloadUrl={configuration.FIRMWARE_GRID_NIGHTLY_URL}
    fileLabel={(filename) =>
      filename.startsWith("grid_d51") ? filename + " (Legacy)" : filename}
  />
{/if}

<FirmwareDownloadOption
  title="Knot Release (Latest)"
  downloadUrl={configuration.FIRMWARE_KNOT_RELEASE_URL}
/>

{#if $appSettings.persistent.nightlyFirmware}
  <FirmwareDownloadOption
    title="Knot Nightly"
    downloadUrl={configuration.FIRMWARE_KNOT_NIGHTLY_URL}
  />
{/if}
