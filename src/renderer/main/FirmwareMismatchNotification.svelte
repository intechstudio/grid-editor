<script lang="ts">
  import { appSettings } from "../runtime/app-helper.store";
  import { Analytics } from "../runtime/analytics.js";
  import { runtime_manager } from "../runtime/runtime-manager.store";
  import { GridRuntime, RuntimeData } from "../runtime/runtime";
  import { Modal } from "./modals/modal.store";
  import FirmwareUpdate from "./modals/FirmwareUpdate.svelte";
  import {
    MoltenPushButton,
    Block,
    BlockRow,
    BlockTitle,
  } from "@intechstudio/grid-uikit";
  import FirmwareDownloadOption from "./components/FirmwareDownloadOption.svelte";
  import { getGridRecommendedFirmwareUrl, getGridRecommendedVersion } from "./firmware_update.ts";
  const configuration = window.ctxProcess.configuration();

  let fwMismatch = false;

  let runtime: GridRuntime;
  $: {
    runtime = $runtime_manager.active.runtime;
  }

  $: handleRuntimeChange($runtime);

  function handleRuntimeChange(data: RuntimeData) {
    appSettings.update((s) => {
      s.firmwareNotificationState = 0;
      return s;
    });

    if (data.modules.length > 0) {
      modal?.close();
      modal = undefined;
      fwMismatch = data.modules.some((device) => device.fwMismatch);
    }

    if (!fwMismatch) {
      return;
    }

    if ($runtime.modules.length > 0) {
      appSettings.update((s) => {
        s.firmwareNotificationState = 1;
        return s;
      });

      Analytics.track({
        event: "FirmwareCheck",
        payload: {
          message: "Mismatch Detected",
        },
        mandatory: false,
      });

      return;
    }

    if ($appSettings.firmwareNotificationState > 1) {
      appSettings.update((s) => {
        s.firmwareNotificationState = 2;
        return s;
      });
      showFirmwareUpdateModal();
    }
  }

  window.electron.firmware.onFirmwareUpdate((_event, value) => {
    const state = value.code;
    if (typeof state === "undefined") {
      return;
    }

    appSettings.update((s) => {
      s.firmwareNotificationState = value.code;
      return s;
    });

    if (state === 3) {
      showFirmwareUpdateModal();
    }

    if ([5, 6].includes(state)) {
      modal = undefined;
    }
  });

  let modal: Modal.Window<any, any>;
  function showFirmwareUpdateModal() {
    if (typeof modal !== "undefined") {
      modal.close();
      modal = undefined;
    }

    modal = new Modal.Window(FirmwareUpdate, Modal.Snap.Full, {
      disableClickOutside: true,
      disableEscapeClose: true,
      showAsUnique: true,
    });
    console.log("SHOW");
    modal.show();
  }

  function handleDismissClicked() {
    appSettings.update((s) => {
      s.firmwareNotificationState = 0;
      return s;
    });
  }

  let showManualOptions = false;

  function toggleManualOptions() {
    showManualOptions = !showManualOptions;
  }

</script>

{#if $appSettings.firmwareNotificationState === 1 || true}
  <div class="w-full bg-error text-white">
    <BlockRow>
      <div class="flex-col">
        <div class="mx-2"><b>Oops, firmware mismatch is detected! </b></div>
        <div class="mx-2">
          Reconnect your module in bootloader mode by holding the utility button
          while plugging in the USB cable!
        </div>
      </div>
      <MoltenPushButton
        text={showManualOptions ? "Hide manual options" : "Show manual options"}
        click={toggleManualOptions}
      />
      <MoltenPushButton text="Dismiss" click={handleDismissClicked} />
    </BlockRow>

    {#if showManualOptions}
      <Block>
      <FirmwareDownloadOption
        title={`Grid D51 Recommended (${getGridRecommendedVersion('d51')})`}
        downloadUrl={getGridRecommendedFirmwareUrl('d51')}
        fileFilter={(file) => file.filename.startsWith("grid_d51")}
      />

      <FirmwareDownloadOption
        title={`Grid ESP32 Recommended (${getGridRecommendedVersion('esp32')})`}
        downloadUrl={getGridRecommendedFirmwareUrl('esp32')}
        fileFilter={(file) => file.filename.startsWith("grid_esp32")}
      />

      <FirmwareDownloadOption
        title="Grid Release (Latest)"
        downloadUrl={configuration.FIRMWARE_GRID_RELEASE_URL}
        fileLabel={(filename) =>
          filename.startsWith("grid_d51") ? filename + " (Legacy)" : filename}
      />

      <FirmwareDownloadOption
        title="Grid Nightly (Latest)"
        downloadUrl={configuration.FIRMWARE_GRID_NIGHTLY_URL}
        fileLabel={(filename) =>
          filename.startsWith("grid_d51") ? filename + " (Legacy)" : filename}
      />

      <FirmwareDownloadOption
        title="Knot Release (Latest)"
        downloadUrl={configuration.FIRMWARE_KNOT_RELEASE_URL}
      />

      <FirmwareDownloadOption
        title="Knot Nightly (Latest)"
        downloadUrl={configuration.FIRMWARE_KNOT_NIGHTLY_URL}
      />
    </Block>
    {/if}
  </div>
{/if}
