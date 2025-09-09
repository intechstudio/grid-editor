<script lang="ts">
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { appSettings } from "../runtime/app-helper.store";
  import { fade } from "svelte/transition";
  import { Analytics } from "../runtime/analytics.js";
  import { runtime_manager } from "../runtime/runtime-manager.store";
  import { GridRuntime } from "../runtime/runtime";
  import { Modal } from "./modals/modal.store";
  import FirmwareUpdate from "./modals/FirmwareUpdate.svelte";

  const configuration = window.ctxProcess.configuration();

  let fwMismatch = false;

  let bootloader_path = undefined;

  // check for parsed modules

  let runtime: GridRuntime;
  $: {
    runtime = $runtime_manager.active.runtime;
    $appSettings.firmwareNotificationState = 0;
  }

  $: {
    let firmwareMismatchFound = false;

    // check modules for firmware mismatch
    for (const device of $runtime.modules) {
      if ($appSettings.firmwareNotificationState == 6) {
        $appSettings.firmwareNotificationState = 0;
        uploadProgressText = "";
        bootloader_path = undefined;
      }

      if (device.fwMismatch === true) {
        firmwareMismatchFound = true;
      }
    }

    // if mismatch is found, show notification
    if (firmwareMismatchFound === true) {
      appSettings.update((s) => {
        s.firmwareNotificationState = 1;
        return s;
      });

      // only if mismatch is not already detected
      if (fwMismatch === false) {
        Analytics.track({
          event: "FirmwareCheck",
          payload: {
            message: "Mismatch Detected",
          },
          mandatory: false,
        });
        fwMismatch = true;
      }
    } else {
      if (fwMismatch) {
        //All mismatched module have been removed, progress state
        appSettings.update((s) => {
          s.firmwareNotificationState = 2;
          return s;
        });
      }
      fwMismatch = false;
    }
  }

  let uploadProgressText = "";

  window.electron.firmware.onFirmwareUpdate((_event, value) => {
    if (value.code !== undefined) {
      if (value.code == 3 && $appSettings.firmwareNotificationState == 4) {
        return;
      }

      if ($appSettings.firmwareNotificationState == 5) {
        return; // already in success state
      }

      $appSettings.firmwareNotificationState = value.code;
      bootloader_path = value.path;

      if (value.message !== undefined) {
        uploadProgressText = value.message;
      }

      // when the firmware update is successful, reset the notification state
      if (value.code == 5) {
        setTimeout(() => {
          $appSettings.firmwareNotificationState = 0;
        }, 2000);
      }
    }
  });

  async function firmwareDownload(nightly) {
    const folder = $appSettings.persistent.profileFolder;
    let result = await window.electron.firmware.findBootloaderPath();
    if (result === undefined) {
      $appSettings.firmwareNotificationState = 6;
      bootloader_path = undefined;
      uploadProgressText = "Bootloader connection lost!";
      return;
    }
    const { product, architecture } = result;

    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        message: "Firmware Download Start",
      },
      mandatory: false,
    });

    let link = undefined;
    switch (product) {
      case "grid":
        if (nightly) {
          switch (architecture) {
            case "esp32":
              link = configuration.FIRMWARE_GRID_NIGHTLY_ESP32_URL;
              break;
            case "d51":
              link = configuration.FIRMWARE_GRID_NIGHTLY_D51_URL;
              break;
          }
        } else {
          const as = get(appSettings);
          let version = undefined;
          switch (architecture) {
            case "esp32":
              version = `v${Object.values(as.firmware_esp32_required).join(
                ".",
              )}`;
              break;
            case "d51":
              version = `v${Object.values(as.firmware_d51_required).join(".")}`;
              break;
          }
          if (typeof version !== "undefined") {
            link =
              configuration.FIRMWARE_GRID_URL_BEGINING +
              version +
              configuration.FIRMWARE_GRID_URL_END;
          }
        }
        break;
      case "knot":
        link =
          configuration.FIRMWARE_KNOT_URL_BEGINING +
          configuration.FIRMWARE_KNOT_URL_END;
        break;
    }

    await window.electron.firmware.firmwareDownload(
      folder,
      product,
      architecture,
      link,
    );

    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        message: "Firmware Download Finished",
      },
      mandatory: false,
    });
  }

  async function firmwareTroubleshooting() {
    Analytics.track({
      event: "FirmwareCheck",
      payload: {
        click: "Troubleshooting",
      },
      mandatory: false,
    });

    const url = configuration.DOCUMENTATION_TROUBLESHOOTING_URL;
    window.electron.openInBrowser(url);
  }

  $: handleFirmwareUpdate($appSettings.firmwareNotificationState);

  function handleFirmwareUpdate(state: number) {
    if (state <= 1) {
      return;
    }

    new Modal.Window(FirmwareUpdate, Modal.Snap.Full, {
      disableClickOutside: true,
      disableEscapeClose: true,
      showAsUnique: true,
    }).show();
  }
</script>

{#if $appSettings.firmwareNotificationState === 1}
  <div
    class="w-full bg-red-600 text-white justify-center flex items-center text-center p-4"
  >
    <div class="flex-col">
      <div class="mx-2"><b>Oops, firmware mismatch is detected! </b></div>
      <div class="mx-2">
        Reconnect your module in bootloader mode by holding the utility button
        while plugging in the USB cable!
      </div>
    </div>
  </div>
{/if}
