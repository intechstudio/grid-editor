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
  <div class="flex flex-col bg-primary rounded-md shadow-xl w-60 p-4">
    <span class="text-xl text-white">No connected modules was found!</span>
    <div class="flex flex-row items-center justify-center gap-4">
      <span class="text-white mt-2 text-justify">
        Try reconnecting your module by plugging it out, then plugging it back
        in.
      </span>

      <div class="w-44 mt-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          class="text-white fill-current"
          viewBox="0 0 96 120"
          enable-background="new 0 0 96 96"
          xml:space="preserve"
          ><path
            d="M63.996,88v6c0,1.1,0.896,2,2,2h6v-4c0-1.1,0.896-2,2-2s2,0.9,2,2v4h4v-4c0-1.1,0.896-2,2-2s2,0.9,2,2v4h6  c1.104,0,2-0.9,2-2v-6H63.996z"
          /><path
            d="M23.996,8V2c0-1.104-0.896-2-2-2h-16c-1.104,0-2,0.896-2,2v6H23.996z"
          /><path
            d="M93.996,48h-14V19.832C79.996,11.1,72.893,4,64.164,4h-4.332C51.1,4,44,11.104,44,19.832v56.332  c0,6.523-5.308,11.832-11.832,11.832h-4.332c-6.524,0-11.832-5.309-11.832-11.832V48h10c1.104,0,2-0.896,2-2V14c0-1.104-0.896-2-2-2  h-24c-1.104,0-2,0.896-2,2v32c0,1.104,0.896,2,2,2h10v28.168C12.004,84.9,19.104,92,27.836,92h4.332C40.9,92,48,84.9,48,76.168  V19.836c0-6.524,5.309-11.832,11.832-11.832h4.332c6.523,0,11.832,5.308,11.832,11.832V48h-14c-1.104,0-2,0.896-2,2v32  c0,1.1,0.896,2,2,2h32c1.104,0,2-0.9,2-2V50C95.996,48.896,95.1,48,93.996,48z"
          /></svg
        >
      </div>
    </div>
  </div>
</div>
