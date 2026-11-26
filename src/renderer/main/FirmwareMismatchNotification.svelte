<script lang="ts">
  import { get } from "svelte/store";
  import { appSettings } from "../runtime/app-helper.store";
  import { Analytics } from "../runtime/analytics.js";
  import { runtime_manager } from "../runtime/runtime-manager.store";
  import { GridRuntime, RuntimeData } from "../runtime/runtime";
  import { ModuleOverlay, moduleOverlay } from "../runtime/moduleOverlay";
  import {
    MoltenPushButton,
    Block,
    BlockRow,
    BlockTitle,
  } from "@intechstudio/grid-uikit";
  import {
    bootloaderInfo,
    bootloaderRebootRequestedAt,
    installFirmware,
  } from "./firmware_install";
  import ManualFirmwareOptions from "./components/ManualFirmwareOptions.svelte";

  let fwMismatch = false;
  let userDismissed = false;
  let overlayShown = false;
  let mismatchTracked = false;
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

    // States 2 and 3 persist while no module is connected (see below)
    const wasWaitingForBootloader = currentState === 2 || currentState === 3;

    appSettings.update((s) => {
      s.firmwareNotificationState = 0;
      return s;
    });

    if (data.modules.length > 0) {
      fwMismatch = data.modules.some((device) => device.fwMismatch);
    }

    if (!fwMismatch) {
      overlayShown = false;
      mismatchTracked = false;
    }

    if (!fwMismatch || userDismissed) {
      return;
    }

    if ($runtime.modules.length > 0) {
      appSettings.update((s) => {
        s.firmwareNotificationState = 1;
        return s;
      });

      // Show bootloader info on the mismatched modules
      if (!overlayShown) {
        overlayShown = true;
        moduleOverlay.show(ModuleOverlay.Types.FIRMWARE_MISMATCH);
      }

      // Runtime changes fire constantly (heartbeats, retries); report once
      if (!mismatchTracked) {
        mismatchTracked = true;
        Analytics.track({
          event: "FirmwareCheck",
          payload: {
            message: "Mismatch Detected",
          },
          mandatory: false,
        });
      }

      return;
    }

    // The mismatched module was unplugged: keep the notification up and wait
    // for it to come back in bootloader mode.
    appSettings.update((s) => {
      s.firmwareNotificationState = wasWaitingForBootloader ? currentState : 2;
      return s;
    });
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
      if (state === 3 && typeof value.message === "string") {
        s.firmwareBootloaderLabel = value.message.replace(
          /\s+is detected!?$/i,
          "",
        );
      }
      return s;
    });

    if (state === 3) {
      bootloaderRebootRequestedAt.set(undefined);
      window.electron.firmware.findBootloaderPathNative().then((result) => {
        Analytics.track({
          event: "FirmwareCheck",
          payload: {
            message: "Bootloader Detected",
            architecture: result?.architecture,
            bootloaderVersion: result?.bootloaderVersion,
          },
          mandatory: false,
        });
      });
    }
  });

  // The bootloader is gone (unplugged, or the module rebooted out of it):
  // go back to waiting for one. Ignored once the update itself has started,
  // since the bootloader disappears at the end of a successful flash.
  window.electron.firmware.onBootloaderRemoved?.(() => {
    if ($appSettings.firmwareNotificationState !== 3) {
      return;
    }
    appSettings.update((s) => {
      s.firmwareNotificationState = 2;
      return s;
    });
  });

  // Only closes the firmware overlay on the modules; the notification stays
  function handleDismissClicked() {
    if (get(moduleOverlay) === ModuleOverlay.Types.FIRMWARE_MISMATCH) {
      moduleOverlay.close();
    }
  }

  // States 2 and 3: no module connected, waiting for / detected a bootloader.
  // Keep the banner up there too.
  $: inBootloader = [2, 3].includes($appSettings.firmwareNotificationState);

  // Waiting for a bootloader because the user pressed a reboot button (as
  // opposed to having just unplugged the module)
  $: rebootRequested =
    $appSettings.firmwareNotificationState === 2 &&
    $bootloaderRebootRequestedAt !== undefined &&
    Date.now() - $bootloaderRebootRequestedAt < 30000;

  let showManualOptions = false;

  function toggleManualOptions() {
    showManualOptions = !showManualOptions;
  }
</script>

{#if $appSettings.firmwareNotificationState === 1 || inBootloader}
  <div
    class="w-full px-4 py-3"
    style="--banner-color: {inBootloader
      ? '#3b82f6'
      : 'var(--error)'}; background: color-mix(in srgb, var(--banner-color), var(--background));"
  >
    <BlockRow>
      <div class="flex items-start gap-3 mr-4 flex-1">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style="background: color-mix(in srgb, var(--banner-color) 30%, var(--background)); color: var(--banner-color);"
        >
          {inBootloader ? "i" : "!"}
        </div>
        <div class="flex flex-col gap-1">
          <div class="font-semibold" style="color: var(--foreground);">
            {#if !inBootloader}
              Outdated firmware detected
            {:else if $appSettings.firmwareNotificationState === 2}
              {rebootRequested
                ? "Rebooting into bootloader"
                : "Waiting for bootloader to be connected"}
            {:else}
              Bootloader detected
            {/if}
          </div>
          <div class="text-sm" style="color: var(--foreground-muted);">
            {#if rebootRequested}
              The module is restarting in bootloader mode. This can take a few
              seconds.
            {:else if $appSettings.firmwareNotificationState === 2}
              Hold the utility button while plugging in the USB cable to enter
              bootloader mode.
            {:else if inBootloader}
              Install the required firmware to start using your module.
            {:else}
              Save your configuration to Profile Cloud before updating to avoid
              losing data. To enter bootloader mode, hold the utility button
              while plugging in the USB cable.
            {/if}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        {#if $appSettings.firmwareNotificationState === 3 && !$bootloaderInfo.isOutdatedD51}
          <MoltenPushButton
            text={"Release"}
            style="accept"
            click={() => installFirmware(false)}
          />
          {#if $appSettings.persistent.nightlyFirmware}
            <MoltenPushButton
              text={"Nightly"}
              click={() => installFirmware(true)}
            />
          {/if}
        {/if}
        <MoltenPushButton
          text={showManualOptions
            ? "Hide manual options"
            : "Show manual options"}
          click={toggleManualOptions}
        />
        <MoltenPushButton
          text="Dismiss overlay"
          style="outlined"
          click={handleDismissClicked}
        />
      </div>
    </BlockRow>

    {#if showManualOptions}
      <div
        class="mt-3 border p-3"
        style="border-color: color-mix(in srgb, var(--error) 1%, var(--background)); border-radius: var(--radius);"
      >
        <ManualFirmwareOptions />
      </div>
    {/if}
  </div>
{/if}
