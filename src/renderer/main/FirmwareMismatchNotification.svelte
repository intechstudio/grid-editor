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

  import { fetchAndExtract, saveFile } from "./firmware_update.ts";
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

  const grid_e32_recommended_version =
    "v" +
    configuration.FIRMWARE_GRID_ESP32_REQUIRED_MAJOR +
    "." +
    configuration.FIRMWARE_GRID_ESP32_REQUIRED_MINOR +
    "." +
    (configuration.FIRMWARE_GRID_ESP32_REQUIRED_PATCH - 1);
  const grid_d51_recommended_version =
    "v" +
    configuration.FIRMWARE_GRID_D51_REQUIRED_MAJOR +
    "." +
    configuration.FIRMWARE_GRID_D51_REQUIRED_MINOR +
    "." +
    (configuration.FIRMWARE_GRID_D51_REQUIRED_PATCH - 1);

  let grid_release_uf2_files = [];
  let grid_nightly_uf2_files = [];
  let grid_release_d51_recommended_uf2_files = [];
  let grid_release_e32_recommended_uf2_files = [];
  let knot_release_uf2_files = [];
  let knot_nightly_uf2_files = [];
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
      <MoltenPushButton text="Dismiss" click={handleDismissClicked} />
    </BlockRow>

    <Block>
      <BlockRow>
        <BlockTitle
          >Grid D51 Recommended ({grid_d51_recommended_version})</BlockTitle
        >

        {#if grid_release_d51_recommended_uf2_files.length === 0}
          <MoltenPushButton
            text="Download and Extract"
            click={async () => {
              grid_release_d51_recommended_uf2_files = await fetchAndExtract(
                "https://github.com/intechstudio/grid-fw/releases/download/" +
                  grid_d51_recommended_version +
                  "/grid_release.zip",
              );
            }}
          />
        {/if}
        {#each grid_release_d51_recommended_uf2_files.filter( (file) => file.filename.startsWith("grid_d51"), ) as file}
          <MoltenPushButton
            text={file.filename}
            click={() => {
              saveFile(file.data, file.filename);
            }}
          />
        {/each}
      </BlockRow>
      <BlockRow>
        <BlockTitle
          >Grid ESP32 Recommended ({grid_e32_recommended_version})</BlockTitle
        >

        {#if grid_release_e32_recommended_uf2_files.length === 0}
          <MoltenPushButton
            text="Download and Extract"
            click={async () => {
              grid_release_e32_recommended_uf2_files = await fetchAndExtract(
                "https://github.com/intechstudio/grid-fw/releases/download/" +
                  grid_e32_recommended_version +
                  "/grid_release.zip",
              );
            }}
          />
        {/if}
        {#each grid_release_e32_recommended_uf2_files.filter( (file) => file.filename.startsWith("grid_esp32"), ) as file}
          <MoltenPushButton
            text={file.filename}
            click={() => {
              saveFile(file.data, file.filename);
            }}
          />
        {/each}
      </BlockRow>
      <BlockRow>
        <BlockTitle>Grid Release (Latest)</BlockTitle>

        {#if grid_release_uf2_files.length === 0}
          <MoltenPushButton
            text="Download and Extract"
            click={async () => {
              grid_release_uf2_files = await fetchAndExtract(
                "https://github.com/intechstudio/grid-fw/releases/latest/download/grid_release.zip",
              );
            }}
          />
        {/if}

        {#each grid_release_uf2_files as file}
          <MoltenPushButton
            text={file.filename.startsWith("grid_d51")
              ? file.filename + " (Legacy)"
              : file.filename}
            click={() => {
              saveFile(file.data, file.filename);
            }}
          />
        {/each}
      </BlockRow>
      <BlockRow>
        <BlockTitle>Grid Nightly (Latest)</BlockTitle>

        {#if grid_nightly_uf2_files.length === 0}
          <MoltenPushButton
            text="Download and Extract"
            click={async () => {
              grid_nightly_uf2_files = await fetchAndExtract(
                "https://github.com/intechstudio/grid-fw/releases/download/nightly/grid_nightly.zip",
              );
            }}
          />
        {/if}

        {#each grid_nightly_uf2_files as file}
          <MoltenPushButton
            text={file.filename.startsWith("grid_d51")
              ? file.filename + " (Legacy)"
              : file.filename}
            click={() => {
              saveFile(file.data, file.filename);
            }}
          />
        {/each}
      </BlockRow>
      <BlockRow>
        <BlockTitle>Knot Release (Latest)</BlockTitle>

        {#if knot_release_uf2_files.length === 0}
          <MoltenPushButton
            text="Download and Extract"
            click={async () => {
              knot_release_uf2_files = await fetchAndExtract(
                configuration.FIRMWARE_KNOT_URL_BEGINING +
                  configuration.FIRMWARE_KNOT_URL_END,
              );
            }}
          />
        {:else}
          {@const file = knot_release_uf2_files[0]}
          <MoltenPushButton
            text={file.filename}
            click={() => {
              saveFile(file.data, file.filename);
            }}
          />
        {/if}
      </BlockRow>
      <BlockRow>
        <BlockTitle>Knot Nightly (Latest)</BlockTitle>

        {#if knot_nightly_uf2_files.length === 0}
          <MoltenPushButton
            text="Download and Extract"
            click={async () => {
              knot_nightly_uf2_files = await fetchAndExtract(
                configuration.FIRMWARE_KNOT_NIGHTLY_URL_BEGINING +
                  configuration.FIRMWARE_KNOT_NIGHTLY_URL_END,
              );
            }}
          />
        {:else}
          {@const file = knot_nightly_uf2_files[0]}
          <MoltenPushButton
            text={file.filename}
            click={() => {
              saveFile(file.data, file.filename);
            }}
          />
        {/if}
      </BlockRow>
    </Block>
  </div>
{/if}
