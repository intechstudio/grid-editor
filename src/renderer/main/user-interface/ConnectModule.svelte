<script>
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

<div class={$$props.class}>
  <div class="flex flex-col bg-primary rounded-md shadow-xl w-72 p-4">
    <span class="text-xl text-white">Connect your module now!</span>
    <span class="text-white mt-2">
      Try refreshing Editor or check out the troubleshooting guide!
    </span>

    <div class="flex justify-between items-center mt-4">
      <button
        on:click={handleRefresh}
        class="relative bg-commit block hover:bg-commit-saturate-20
                text-white py-1 px-2 rounded border-commit-saturate-10
                hover:border-commit-desaturate-10 focus:outline-none"
      >
        <div>Refresh</div>
      </button>

      <button
        on:click={handleTroubleshoot}
        class="relative border block hover:bg-commit-saturate-20
                text-white py-1 px-2 rounded border-commit-saturate-10
                hover:border-commit-desaturate-10 focus:outline-none"
      >
        <div>Troubleshooting</div>
      </button>
    </div>
  </div>
</div>
