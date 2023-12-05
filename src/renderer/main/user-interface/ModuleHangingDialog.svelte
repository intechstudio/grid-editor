<script>
  import Spinner from "./Spinner.svelte";
  import SendFeedback from "./SendFeedback.svelte";
  import { fade, blur } from "svelte/transition";
  import { Analytics } from "../../runtime/analytics";
  import { writeBuffer } from "../../runtime/engine.store.js";
  import { logger } from "../../runtime/runtime.store";

  let moduleHanging1 = false;
  let moduleHanging2 = false;

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
</script>

<div in:fade={{ delay: 300, duration: 1000 }} out:blur={{ duration: 150 }}>
  <div class="flex flex-row items-center gap-2">
    <Spinner class="scale-50 -mx-5" />
    {#if moduleHanging1 || moduleHanging2}
      {#if moduleHanging1}
        <span class="text-white w-72"
          >One of your modules is not responding. Abort the active configuration
          process?
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
