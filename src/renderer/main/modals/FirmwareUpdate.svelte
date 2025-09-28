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
  import { get } from "svelte/store";
  export let data: Modal.Instance;

  const logoURI = `url("data:image/svg+xml;utf8,${encodeURIComponent(logo)}")`;
  const logoBrokenURI = `url("data:image/svg+xml;utf8,${encodeURIComponent(logoBroken)}")`;

  const configuration = window.ctxProcess.configuration();

  function handleDismissClicked() {
    appSettings.update((s) => {
      s.firmwareNotificationState = 0;
      return s;
    });
    data.close();
  }

  async function handleFirmwareDownload(nightly: boolean = false) {
    const folder = $appSettings.persistent.profileFolder;
    let result = await window.electron.firmware.findBootloaderPath();
    if (result === undefined) {
      $appSettings.firmwareNotificationState = 6;
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

  window.electron.firmware.onFirmwareUpdate((_event, value) => {
    const state = value.code;
    if (typeof state === "undefined") {
      return;
    }

    if ([5, 6].includes(state)) {
      setTimeout(handleDismissClicked, 2000);
    }
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
    <div class="flex w-full flex-col gap-2 items-center" slot="content">
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
        <div class="flex flex-row -mr-5">
          <MoltenPushButton
            text={"Release"}
            style="accept"
            click={handleFirmwareDownload}
          />
          <div class=" ml-5">
            <MoltenPushButton
              text={"Nightly"}
              click={() => {
                handleFirmwareDownload(true);
              }}
            />
          </div>
          <div class="flex flex-col items-center">
            <MoltenPushButton
              text={"Dismiss"}
              style="outlined"
              click={handleDismissClicked}
            />
            <span class="text-foreground-soft text-sm text-center px-2"
              >Unplug your device</span
            >
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
          <SvgIcon iconPath="tick" fill="#0BA484" width={20} height={20} />
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
