<script lang="ts">
  import { appSettings } from "../runtime/app-helper.store";
  import { Analytics } from "../runtime/analytics.js";
  import { runtime_manager } from "../runtime/runtime-manager.store";
  import { GridRuntime, RuntimeData } from "../runtime/runtime";
  import { Modal } from "./modals/modal.store";
  import FirmwareUpdate from "./modals/FirmwareUpdate.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

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
</script>

{#if $appSettings.firmwareNotificationState === 1}
  <div
    class="w-full bg-error text-white justify-center flex flex-row items-center text-center p-4 gap-2"
  >
    <div class="flex-col">
      <div class="mx-2"><b>Oops, firmware mismatch is detected! </b></div>
      <div class="mx-2">
        Reconnect your module in bootloader mode by holding the utility button
        while plugging in the USB cable!
      </div>
    </div>
    <MoltenPushButton text="Dismiss" click={handleDismissClicked} />
  </div>
{/if}
