<script lang="ts" context="module">
  // STATE 0 | No notification (Init state)
  // STATE 1 | Mismatch notofic.   | Event   -> STATE 2
  // STATE 2 | Waiting for bootl.  | Event   -> STATE 3
  // STATE 3 | Bootloader detected | Button  -> STATE 4 (starts automated upload process)
  // STATE 4 | Update in progress  | Event   -> STATE 5 (Success) or STATE 6 (Error)
  // STATE 5 | Success             | Timeout -> STATE 0 (Close notification)
  // STATE 6 | Error               | Button  -> STATE 0 (Close notification)

  function getModalStyle(state: number) {
    switch (state) {
      case 5:
        return "success";
      case 5:
        return "error";
      default:
        return "normal";
    }
  }
</script>

<script lang="ts">
  import MoltenModal from "./MoltenModal.svelte";
  import { Modal } from "./modal.store";
  import { MoltenPushButton, SvgIcon } from "@intechstudio/grid-uikit";
  import logo from "../../assets/svgs/logo.svg?raw";
  import logoBroken from "../../assets/svgs/logo-broken.svg?raw";
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import { onDestroy } from "svelte";
  import { get } from "svelte/store";
  import {
    getGridRecommendedFirmwareUrl,
    fetchAndExtract,
    isMultiarchGroup,
  } from "../firmware_update.ts";
  import ManualFirmwareOptions from "../components/ManualFirmwareOptions.svelte";
  export let data: Modal.Instance;

  const logoURI = `url("data:image/svg+xml;utf8,${encodeURIComponent(logo)}")`;
  const logoBrokenURI = `url("data:image/svg+xml;utf8,${encodeURIComponent(logoBroken)}")`;

  const configuration = window.ctxProcess.configuration();

  let showManualOptions = false;

  function toggleManualOptions() {
    showManualOptions = !showManualOptions;
  }

  function handleDismissClicked() {
    appSettings.update((s) => {
      s.firmwareNotificationState = 0;
      return s;
    });
    data.close();
  }

  async function handleFirmwareDownload(nightly: boolean = false) {
    try {
      // Set state to downloading immediately
      appSettings.update((s) => {
        s.firmwareNotificationState = 4;
        return s;
      });

      // Check if bootloader is connected
      let result = await window.electron.firmware.findBootloaderPathNative();
      if (result === undefined) {
        appSettings.update((s) => {
          s.firmwareNotificationState = 6;
          return s;
        });
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

      // Determine the firmware URL
      let link = undefined;
      switch (product) {
        case "grid":
          if (nightly) {
            link = configuration.FIRMWARE_GRID_NIGHTLY_URL;
          } else {
            link = getGridRecommendedFirmwareUrl(architecture);
          }
          break;
        case "knot":
          link = configuration.FIRMWARE_KNOT_RELEASE_URL;
          break;
      }

      if (!link) {
        appSettings.update((s) => {
          s.firmwareNotificationState = 6;
          return s;
        });
        return;
      }

      // Download and extract firmware in the frontend
      const uf2Files = await fetchAndExtract(link);

      // Find the correct firmware file based on product and architecture
      let firmwareFile = null;
      const useMultiarch = product === "grid" && isMultiarchGroup();

      for (const file of uf2Files) {
        const filename = file.filename.toLowerCase();

        if (product === "grid") {
          if (
            useMultiarch &&
            filename.includes("multiarch") &&
            filename.includes("grid")
          ) {
            firmwareFile = file;
            break;
          } else if (
            !useMultiarch &&
            architecture === "esp32" &&
            filename.includes("esp32") &&
            filename.includes("grid")
          ) {
            firmwareFile = file;
            break;
          } else if (
            !useMultiarch &&
            architecture === "d51" &&
            filename.includes("d51") &&
            filename.includes("grid")
          ) {
            firmwareFile = file;
            break;
          }
        } else if (product === "knot") {
          if (filename.includes("knot")) {
            firmwareFile = file;
            break;
          }
        }
      }

      if (!firmwareFile) {
        console.error("Could not find matching firmware file", {
          product,
          architecture,
          uf2Files,
        });
        appSettings.update((s) => {
          s.firmwareNotificationState = 6;
          return s;
        });
        return;
      }

      // Send firmware data to backend for writing to bootloader
      await window.electron.firmware.writeFirmwareToBootloader(
        Array.from(firmwareFile.data),
        firmwareFile.filename,
      );

      Analytics.track({
        event: "FirmwareCheck",
        payload: {
          message: "Firmware Download Finished",
          filename: firmwareFile.filename,
        },
        mandatory: false,
      });
    } catch (error) {
      console.error("Firmware download error:", error);
      appSettings.update((s) => {
        s.firmwareNotificationState = 6;
        return s;
      });
    }
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
  <MoltenModal
    {data}
    width={"350px"}
    style={getModalStyle($appSettings.firmwareNotificationState)}
  >
    <div class="flex w-full flex-col gap-2 items-center p-6" slot="content">
      {#if $appSettings.firmwareNotificationState === 2}
        <span class="text-lg">Waiting for module...</span>
        <!-- Masked container -->
        <div
          class="relative w-32 h-20 inset-0 bg-foreground-soft"
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
          />
        </div>
        <MoltenPushButton
          text={"Dismiss"}
          style="outlined"
          click={handleDismissClicked}
        />
        <span class="text-foreground-soft text-sm text-center px-2"
          >If you want to update your device, reconnect your module in bootlader
          mode by holding the utility button while plugging in the USB cable!</span
        >
      {/if}
      {#if $appSettings.firmwareNotificationState === 3}
        <div class="flex flex-col items-center">
          <span class="text-foreground-soft">An update is available</span>
          <span class="text-lg">Do you want to update your firmware?</span>
        </div>

        <div
          class="flex w-32 h-20 inset-0 bg-foreground-soft"
          style="
            mask: {logoURI} no-repeat center;
            -webkit-mask: {logoURI} no-repeat center;
            mask-size: contain;
            -webkit-mask-size: contain;
          "
        />
        <div class="flex flex-col gap-2 w-full items-center">
          <div class="flex flex-row gap-2">
            <MoltenPushButton
              text={"Release"}
              style="accept"
              click={handleFirmwareDownload}
            />
            {#if $appSettings.persistent.nightlyFirmware}
              <MoltenPushButton
                text={"Nightly"}
                click={() => {
                  handleFirmwareDownload(true);
                }}
              />
            {/if}
          </div>
          <MoltenPushButton
            text={showManualOptions
              ? "Hide manual options"
              : "Show manual options"}
            click={toggleManualOptions}
          />
          {#if showManualOptions}
            <div class="flex flex-col gap-2 w-full px-4 py-8">
              <ManualFirmwareOptions />
            </div>
          {/if}
          <div class="flex flex-col items-center">
            <MoltenPushButton
              text={"Dismiss"}
              style="outlined"
              click={handleDismissClicked}
            />
          </div>
        </div>
      {/if}
      {#if $appSettings.firmwareNotificationState === 4}
        <span class="text-lg">Update is in progress...</span>

        <div
          class="flex w-32 h-20 inset-0 bg-foreground-soft border"
          style="
          mask: {logoURI} no-repeat center;
          -webkit-mask: {logoURI} no-repeat center;
          mask-size: contain;
          -webkit-mask-size: contain;
        "
        >
          <div class="flex h-full bg-intech-yellow animate-loading" />
        </div>
        <span class="text-sm text-foreground-soft"
          >Do not disconnect the module!</span
        >
      {/if}
      {#if [5, 6].includes($appSettings.firmwareNotificationState)}
        <div class="flex flex-row items-center">
          <span class="text-lg">Update completed!</span>
        </div>
        <div class="relative w-32 h-20">
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
  </MoltenModal>
{/if}

<style>
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
