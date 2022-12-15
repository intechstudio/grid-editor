<script>
  import { onMount } from "svelte";

  const ctxProcess = window.ctxProcess;

  let logelement;
  let text = "";

  let logtext = [];

  onMount(() => {
    // check for errors

    window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
      console.log("we got exception, but the app has crashed", errorMsg);
      logtext = [...logtext, errorMsg];

      window.electron.analytics.influx(
        "application",
        "error console",
        "error notification",
        "error event"
      );

      try {
        window.electron.discord.sendMessage({ title: "Error", text: errorMsg });
      } catch (error) {}

      return false;
    };

    window.onunhandledrejection = (e) => {
      console.log("we got exception, but the app has crashed", e);
      logtext = [...logtext, e.reason];

      window.electron.analytics.influx(
        "application",
        "error console",
        "error notification",
        "error event"
      );

      try {
        window.electron.discord.sendMessage({ title: "Error", text: e.reason });
      } catch (error) {}
    };

    if (ctxProcess.platform() == "darwin") {
      text = "Command + Shift + R";
    } else {
      text = "Ctrl + Shift + R";
    }
  });

  function refresh() {
    window.electron.analytics.influx(
      "application",
      "error console",
      "error notification",
      "app restart"
    );
    window.electron.restartApp();
  }

  function dismiss() {
    logtext = [];
    window.electron.analytics.influx(
      "application",
      "error console",
      "error notification",
      "dismiss"
    );
  }
</script>

{#if logtext.length != 0}
  <div
    bind:this={logelement}
    class="w-full bg-red-600 text-white justify-center flex flex-col items-center"
  >
    {#each logtext as log}
      <div>{log}</div>
    {/each}

    <div class="flex flex-row items-center">
      Reload the application using {text} or click

      <button
        on:click={refresh}
        class="relative bg-gray-500 mr-3 block hover:bg-gray-300 text-white ml-3 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
      >
        Restart
      </button>
      <button
        on:click={dismiss}
        class="relative bg-gray-500 mr-3 block hover:bg-gray-300 text-white ml-1 my-2 py-1 px-2 rounded border-commit-saturate-10 hover:border-commit-desaturate-10 focus:outline-none"
      >
        Dismiss
      </button>
    </div>
  </div>
{/if}

<style>
</style>
