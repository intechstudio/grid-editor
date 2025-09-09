<script lang="ts">
  /*
STATE 0 | No notification (Init state)
STATE 1 | Mismatch notofic.   | Event   -> STATE 2
STATE 2 | Waiting for bootl.  | Event   -> STATE 3
STATE 3 | Bootloader detected | Button  -> STATE 4 (starts automated upload process)
STATE 4 | Update in progress  | Event   -> STATE 5 (Success) or STATE 6 (Error)
STATE 5 | Success             | Timeout -> STATE 0 (Close notification)
STATE 6 | Error               | Button  -> STATE 0 (Close notification)
*/

  import MoltenModal from "./MoltenModal.svelte";
  import { Modal } from "./modal.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import logo from "../../assets/svgs/logo.svg?raw";
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import { GridRuntime } from "../../runtime/runtime";
  import { get } from "svelte/store";

  export let data: Modal.Instance;

  const logoMask = `url("data:image/svg+xml;utf8,${encodeURIComponent(logo)}")`;

  const configuration = window.ctxProcess.configuration();

  let fwMismatch = false;

  let bootloader_path = undefined;

  // check for parsed modules

  let runtime: GridRuntime;

  let uploadProgressText = "";

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

  $: console.log("YAy", $appSettings.firmwareNotificationState);
</script>

<div id="modal-copy-placeholder" />

<MoltenModal {data} width={"350px"}>
  <div class="flex w-full flex-col gap-2 items-center" slot="content">
    {#if $appSettings.firmwareNotificationState === 2}
      <span class="text-lg">Waiting for module...</span>
      <div class="relative w-32 h-20">
        <!-- Masked container -->
        <div
          class="absolute inset-0 bg-white/10"
          style="
            mask: {logoMask} no-repeat center;
            -webkit-mask: {logoMask} no-repeat center;
            mask-size: contain;
            -webkit-mask-size: contain;
          "
        >
          <!-- Scrolling blurred band -->
          <div
            class="absolute top-0 left-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-slide"
          ></div>
        </div>
      </div>
      <MoltenPushButton text={"Dismiss"} style="outlined" click={() => {}} />
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
      <div class="relative w-32 h-20">
        <!-- Masked container -->
        <div
          class="absolute inset-0 bg-white/10"
          style="
            mask: {logoMask} no-repeat center;
            -webkit-mask: {logoMask} no-repeat center;
            mask-size: contain;
            -webkit-mask-size: contain;
          "
        ></div>
      </div>
      <div class="flex flex-row -mr-5">
        <MoltenPushButton text={"Release"} style="accept" click={() => {}} />
        <div class=" ml-5">
          <MoltenPushButton text={"Nightly"} click={() => {}} />
        </div>
        <div class="flex flex-col items-center">
          <MoltenPushButton
            text={"Dismiss"}
            style="outlined"
            click={() => {}}
          />
          <span class="text-foreground-soft text-sm text-center px-2"
            >Unplug your device</span
          >
        </div>
      </div>
    {/if}
    {#if $appSettings.firmwareNotificationState === 4}{/if}
    {#if $appSettings.firmwareNotificationState === 5}{/if}
    {#if $appSettings.firmwareNotificationState === 6}{/if}
  </div>
</MoltenModal>

<style>
  @keyframes slide {
    0% {
      transform: translateX(-200%);
    }
    100% {
      transform: translateX(200%);
    }
  }
  .animate-slide {
    animation: slide 2s linear infinite;
  }
</style>
