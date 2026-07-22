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
  import ManualFirmwareOptions from "./components/ManualFirmwareOptions.svelte";

  let fwMismatch = false;
  let userDismissed = false;
  let prevModuleCount = 0;

  let runtime: GridRuntime;
  $: {
    runtime = $runtime_manager.active.runtime;
  }

  $: handleRuntimeChange($runtime);

  function handleRuntimeChange(data: RuntimeData) {
    // Don't reset state if firmware update is in progress or completed
    const currentState = $appSettings.firmwareNotificationState;
    if (currentState >= 4) {
      return;
    }

    if (data.modules.length !== prevModuleCount) {
      userDismissed = false;
      prevModuleCount = data.modules.length;
    }

    appSettings.update((s) => {
      s.firmwareNotificationState = 0;
      return s;
    });

    if (data.modules.length > 0) {
      modal?.close();
      modal = undefined;
      fwMismatch = data.modules.some((device) => device.fwMismatch);
    }

    if (!fwMismatch || userDismissed) {
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
    const currentState = $appSettings.firmwareNotificationState;
    if (typeof state === "undefined") {
      return;
    }

    // Don't allow IPC events to set state backwards (e.g., from 4 back to 3)
    if (state < currentState) {
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
    modal.show();
  }

  function handleDismissClicked() {
    userDismissed = true;
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

{#if $appSettings.firmwareNotificationState === 1}
  <div class="w-full text-white" style="background: var(--error);">
    <BlockRow>
      <div class="flex-col">
        <div class="mx-2"><b>Oops, firmware mismatch is detected! </b></div>
        <div class="mx-2">
          <p>
            Please Save your configuration to the Profile Cloud before updating
            to prevent loss of data.
          </p>
          <p>
            Reconnect your module in bootloader mode by holding the utility
            button while plugging in the USB cable!
          </p>
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
        <ManualFirmwareOptions />
      </Block>
    {/if}
  </div>
{/if}
