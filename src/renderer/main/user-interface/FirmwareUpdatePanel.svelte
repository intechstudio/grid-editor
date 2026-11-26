<!--
  STATE 0 | No notification (Init state)
  STATE 1 | Mismatch notific.   | Event   -> STATE 2
  STATE 2 | Waiting for bootl.  | Event   -> STATE 3
  STATE 3 | Bootloader detected | Button  -> STATE 4 (starts automated upload process)
  STATE 4 | Update in progress  | Event   -> STATE 5 (Success) or STATE 6 (Error)
  STATE 5 | Success             | Timeout -> STATE 0 (Close notification)
  STATE 6 | Error               | Button  -> STATE 0 (Close notification)
-->

<script lang="ts">
  import { MoltenPushButton, SvgIcon } from "@intechstudio/grid-uikit";
  import logo from "../../lib/assets/svgs/logo.svg?raw";
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import { onDestroy } from "svelte";
  import {
    bootloaderInfo,
    checkBootloaderVersion,
    installFirmware,
  } from "../firmware_install";

  // Fill a parent (the mock module overlay) instead of being a standalone card
  export let compact = false;

  const logoURI = `url("data:image/svg+xml;utf8,${encodeURIComponent(logo)}")`;

  const configuration = window.ctxProcess.configuration();

  $: if ($appSettings.firmwareNotificationState === 3) {
    checkBootloaderVersion();
  }

  function handleOpenBootloaderDocs() {
    window.electron.openInBrowser(
      configuration.DOCUMENTATION_D51_BOOTLOADER_TROUBLESHOOTING_URL,
    );
  }

  function handleDismissClicked() {
    appSettings.update((s) => {
      s.firmwareNotificationState = 0;
      return s;
    });
  }

  const unsubscribeFirmwareUpdate = window.electron.firmware.onFirmwareUpdate(
    (_event, value) => {
      const state = value.code;
      if (typeof state === "undefined") {
        return;
      }

      if ([5, 6].includes(state)) {
        setTimeout(handleDismissClicked, 2000);
      }
    },
  );

  onDestroy(() => {
    unsubscribeFirmwareUpdate?.();
  });

  async function handleTroubleShoot() {
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
</script>

{#if $appSettings.firmwareNotificationState}
  <div
    style={compact
      ? "color: var(--foreground);"
      : "background-color: var(--background); color: var(--foreground); border: solid var(--border); border-radius: var(--radius);"}
    class="flex flex-col items-center gap-2 {compact
      ? 'compact w-full h-full justify-center overflow-y-auto p-3 text-sm text-center'
      : 'rounded-md shadow-xl w-[350px] p-6'}"
  >
    {#if $appSettings.firmwareNotificationState === 2}
      <span class="text-lg">Waiting for module...</span>
      <!-- Masked container -->
      <div
        class="logo relative w-32 h-20 inset-0 bg-foreground-soft"
        style="
            mask: {logoURI} no-repeat center;
            -webkit-mask: {logoURI} no-repeat center;
            mask-size: contain;
            -webkit-mask-size: contain;
          "
      >
        <!-- Scrolling blurred band -->
        <div
          class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-foreground to-transparent animate-waiting"
        ></div>
      </div>
      <span class="text-foreground-soft text-sm text-center px-2"
        >If you want to update your device, reconnect your module in bootlader
        mode by holding the utility button while plugging in the USB cable!</span
      >
    {/if}
    {#if $appSettings.firmwareNotificationState === 3}
      <div class="flex flex-col items-center">
        <span class="text-foreground-soft"
          >{$appSettings.firmwareBootloaderLabel
            ? `${$appSettings.firmwareBootloaderLabel} detected`
            : "An update is available"}</span
        >
        {#if $bootloaderInfo.version}
          <span class="text-foreground-soft text-xs"
            >{$bootloaderInfo.version}</span
          >
        {/if}
        <span class="text-lg"
          >{$bootloaderInfo.isOutdatedD51
            ? "Outdated bootloader detected"
            : "Do you want to update your firmware?"}</span
        >
      </div>

      <div
        class="logo logo-state3 flex w-32 h-20 inset-0 bg-foreground-soft"
        style="
            mask: {logoURI} no-repeat center;
            -webkit-mask: {logoURI} no-repeat center;
            mask-size: contain;
            -webkit-mask-size: contain;
          "
      ></div>
      {#if $bootloaderInfo.isOutdatedD51}
        <div class="flex flex-col gap-2 w-full items-center">
          <span class="text-sm text-foreground-soft text-center px-2">
            Your module's bootloader needs to be updated to {configuration.BOOTLOADER_GRID_D51_REQUIRED_VERSION}
            before firmware can be installed.
          </span>
          <MoltenPushButton
            text={"View troubleshooting guide"}
            style="accept"
            click={handleOpenBootloaderDocs}
          />
        </div>
      {:else}
        <div class="flex flex-col gap-2 w-full items-center">
          <div class="flex flex-row gap-2">
            <MoltenPushButton
              text={"Release"}
              style="accept"
              click={() => installFirmware(false)}
            />
            {#if $appSettings.persistent.nightlyFirmware}
              <MoltenPushButton
                text={"Nightly"}
                click={() => {
                  installFirmware(true);
                }}
              />
            {/if}
          </div>
        </div>
      {/if}
    {/if}
    {#if $appSettings.firmwareNotificationState === 4}
      <span class="text-lg">Update is in progress...</span>

      <div
        class="logo flex w-32 h-20 inset-0 bg-foreground-soft border"
        style="
          mask: {logoURI} no-repeat center;
          -webkit-mask: {logoURI} no-repeat center;
          mask-size: contain;
          -webkit-mask-size: contain;
        "
      >
        <div class="flex h-full bg-intech-yellow animate-loading"></div>
      </div>
      <span class="text-sm text-foreground-soft"
        >Do not disconnect the module!</span
      >
    {/if}
    {#if [5, 6].includes($appSettings.firmwareNotificationState)}
      <div class="flex flex-row items-center">
        <span class="text-lg">Update completed!</span>
      </div>
      <div class="logo relative w-32 h-20">
        <!-- Masked container -->
        <div
          class="absolute inset-0 bg-foreground"
          style="
          mask: {logoURI} no-repeat center;
          -webkit-mask: {logoURI} no-repeat center;
          mask-size: contain;
          -webkit-mask-size: contain;
        "
        ></div>
      </div>
      <span class="text-sm text-foreground-soft"
        >You will be redirected to Grid Editor in a few seconds...</span
      >
    {/if}

    <!-- Unused unsuccessful state. Reason: After update is complete, the state is always unsuccessful, since USB connection is dropped at the end of copy
      
        <div class="flex flex-row gap-1 items-center">
          <span class="text-lg">Update was unsuccessful!</span>
          <SvgIcon iconPath="close" fill="#DC2626" width={10} height={10} />
        </div>
        <div
          class="relative w-32 h-20 inset-0 bg-foreground"
          style="
          mask: {logoBrokenURI} no-repeat center;
          -webkit-mask: {logoBrokenURI} no-repeat center;
          mask-size: contain;
          -webkit-mask-size: contain;
        "
        />
        <div class="flex flex-row gap-2">
          <MoltenPushButton
            text={"Troubleshoot"}
            style="outlined"
            click={handleTroubleShoot}
          />
          <MoltenPushButton text={"Cancel"} click={handleDismiss} />
        </div> -->
  </div>
{/if}

<style>
  .compact .logo {
    width: 4rem;
    height: 2.5rem;
  }
  .compact .logo-state3 {
    display: none;
  }

  @keyframes waiting {
    0% {
      transform: translateX(-200%);
    }
    100% {
      transform: translateX(200%);
    }
  }
  .animate-waiting {
    animation: waiting 3s linear infinite;
  }

  @keyframes loading {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }
  .animate-loading {
    animation: loading 1.5s linear infinite;
  }
</style>
