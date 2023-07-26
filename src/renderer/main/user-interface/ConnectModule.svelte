<script>
  import { fade } from "svelte/transition";
  import { Analytics } from "../../runtime/analytics.js";

  const configuration = window.ctxProcess.configuration();

  function handleRefresh() {
    Analytics.track({
      event: "No Module Connected",
      payload: {
        click: "Refresh",
      },
      mandatory: false,
    });

    setTimeout(() => {
      window.electron.restartApp();
    }, 500);
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
</script>

<div class="{$$props.class} flex outline-none justify-center items-center">
  <div
    in:fade={{ delay: 2000, duration: 1000 }}
    class="flex w-full h-full items-center justify-center text-white
          flex-col"
  >
    <div class=" absolute top-0 left-0 p-4 bg-primary rounded shadow w-72">
      <div class="text-xl py-1">Connect your module now!</div>
      <div class="py-1">
        Try refreshing Editor or check out the troubleshooting guide!
      </div>

      <div class="flex justify-between items-center">
        <button
          on:click={handleRefresh}
          class="relative bg-commit mr-3 block hover:bg-commit-saturate-20
                text-white mt-3 mb-1 py-1 px-2 rounded border-commit-saturate-10
                hover:border-commit-desaturate-10 focus:outline-none"
        >
          <div>Refresh</div>
        </button>

        <button
          on:click={handleTroubleshoot}
          class="relative border block hover:bg-commit-saturate-20
                text-white mt-3 mb-1 py-1 px-2 rounded border-commit-saturate-10
                hover:border-commit-desaturate-10 focus:outline-none"
        >
          <div>Troubleshooting</div>
        </button>
      </div>
    </div>
  </div>
</div>
