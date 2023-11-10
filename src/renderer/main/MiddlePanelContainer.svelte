<script>
  import Pages from "./panels/configuration/components/Pages.svelte";
  import CursorLog from "./user-interface/cursor-log/CursorLog.svelte";
  import Tracker from "./user-interface/Tracker.svelte";
  import ActiveChanges from "./user-interface/ActiveChanges.svelte";
  import ModulConnectionDialog from "./user-interface/ModulConnectionDialog.svelte";
  import { fade, blur, fly } from "svelte/transition";
  import Spinner from "./user-interface/Spinner.svelte";
  import SendFeedback from "./user-interface/SendFeedback.svelte";
  import { selectedConfigStore } from "../runtime/config-helper.store";
  import { runtime, logger } from "../runtime/runtime.store";
  import { writeBuffer } from "../runtime/engine.store.js";
  import { appSettings } from "../runtime/app-helper.store";
  import GridLayout from "./grid-layout/GridLayout.svelte";
  import { derived } from "svelte/store";

  let logLength = 0;
  let trackerVisible = true;

  $: {
    trackerVisible =
      logLength === 0 &&
      !moduleHanging1 &&
      !moduleHanging2 &&
      $writeBuffer.length == 0;
  }

  function handleContentChange(e) {
    const { DOMElementCount } = e.detail;
    logLength = DOMElementCount;
  }

  function handleWaitClicked(e) {
    hangingTimeout = setTimeout(() => {
      moduleHanging2 = true;
    }, 10000);
    moduleHanging1 = false;
    waitClicked = true;
  }

  function handleAbortclicked(e) {
    window.electron.discord.sendMessage({
      title: "Writebuffer",
      text: JSON.stringify($writeBuffer).substring(0, 1000),
    });

    Analytics.track({
      event: "Writebuffer",
      payload: {
        click: "Clear",
        writeBufferLength: $writeBuffer,
      },
      mandatory: false,
    });

    writeBuffer.clear();

    logger.set({
      type: "alert",
      mode: 0,
      classname: "module-crashed",
      message: `Check your connected modules, and re-snap those that you can't see in Editor!`,
    });
  }

  let moduleHanging1 = false;
  let moduleHanging2 = false;
  let hangingTimeout = undefined;
  let waitClicked = false;
  let bufferLength = 0;

  $: {
    if (bufferLength != $writeBuffer.length) {
      clearTimeout(hangingTimeout);
      if ($writeBuffer.length > 0) {
        if (!moduleHanging1 && !moduleHanging2) {
          hangingTimeout = setTimeout(() => {
            moduleHanging1 = true;
          }, 5000);
        }
      } else {
        moduleHanging1 = false;
        moduleHanging2 = false;
        waitClicked = false;
      }
      bufferLength = $writeBuffer.length;
    }
  }

  async function handleTroubleshoot() {
    const url = configuration.DOCUMENTATION_TROUBLESHOOTING_URL;

    window.electron.openInBrowser(url);

    Analytics.track({
      event: "No Module Connected",
      payload: {
        click: "Troubleshooting",
      },
      mandatory: false,
    });
  }

  let scalingPercent = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.persistent.size
  );
</script>

<div
  class="relative flex flex-col w-full h-full overflow-clip items-center justify-center"
>
  <GridLayout scale={$scalingPercent} />
  <Pages />
  {#if $writeBuffer.length > 0 && $runtime.length > 0}
    <div
      in:fade={{ delay: 300, duration: 300 }}
      out:blur={{ duration: 150 }}
      class="absolute z-0 top-0 left-0 w-full h-full backdrop-blur-sm bg-primary bg-opacity-20"
    />
  {/if}

  {#if $writeBuffer.length > 0 && $runtime.length > 0}
    <div
      in:fade={{ delay: 300, duration: 1000 }}
      out:blur={{ duration: 150 }}
      class="w-fit self-center mt-10 z-[1] bg-primary py-2 px-4 rounded-lg shadow"
    >
      <div class="flex flex-row items-center gap-2">
        <Spinner class="scale-50 -mx-5" />
        {#if moduleHanging1 || moduleHanging2}
          {#if moduleHanging1}
            <span class="text-white w-72"
              >One of your modules is not responding. Abort the active
              configuration process?
            </span>
            <button
              on:click={handleAbortclicked}
              class="relative items-center justify-center focus:outline-none bg-error
  rounded text-white py-1 w-24 hover:bg-error-desaturate-20"
            >
              <div>Abort</div>
            </button>
            <button
              on:click={handleWaitClicked}
              class="relative w-24 rounded bg-select text-white hover:bg-select-saturate-10 py-1"
            >
              <div>Wait</div>
            </button>
          {/if}
          {#if moduleHanging2}
            <span class="text-white w-80"
              >One of your modules is still not responding. Abort or try
              troubleshooting.
              <SendFeedback
                feedback_context="Module not responding"
                class="self-start text-gray-500"
              />
            </span>

            <button
              on:click={handleAbortclicked}
              class="relative items-center justify-center focus:outline-none bg-error
  rounded text-white py-1 w-24 hover:bg-error-desaturate-20"
            >
              <div>Abort</div>
            </button>
            <button
              on:click={handleTroubleshoot}
              class="relative block bg-select text-white hover:bg-select-saturate-10 py-1 px-2 rounded focus:outline-none"
            >
              <div>Troubleshooting</div>
            </button>
          {/if}
        {:else}
          <span class="text-white w-56"
            >Loading <span class="text-orange-300 font-bold"
              >{$writeBuffer.length}</span
            > more configuration to your module...</span
          >
        {/if}
      </div>
    </div>
  {:else}
    <ActiveChanges class="absolute top-0 w-fit self-center mt-10 z-11" />
    {#if $selectedConfigStore?.configType === "preset"}
      <button
        class="self-center mt-4 z-10 relative items-center justify-center focus:outline-none bg-select
                      rounded text-white py-1 w-24 hover:bg-yellow-600"
        on:click={() => {
          selectedConfigStore.set({});
        }}
      >
        <div>Cancel</div>
      </button>
    {/if}
  {/if}

  {#if $runtime.length == 0 && $appSettings.firmwareNotificationState === 0}
    <div
      in:fade|global={{ delay: 2000, duration: 1000 }}
      out:blur|global={{ duration: 150 }}
      class="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2"
    >
      <ModulConnectionDialog />
    </div>
  {/if}

  <div class="flex">
    {#if trackerVisible}
      <div
        in:fly|global={{ x: -10 }}
        out:fly|global={{ x: 10 }}
        class="w-fit absolute right-0 bottom-0 mb-12 mr-10"
      >
        <Tracker />
      </div>
    {/if}

    <CursorLog
      class="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 z-[1]"
      on:content-change={handleContentChange}
    />
  </div>
</div>
