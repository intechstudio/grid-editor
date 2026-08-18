<script>
  import { Modal } from "./../modals/modal.store";
  import { MoltenPushButton, SvgIcon } from "@intechstudio/grid-uikit";
  import { Analytics } from "../../runtime/analytics.js";
  import SendFeedback from "./SendFeedback.svelte";
  import AddVirtualModule from "../modals/AddVirtualModule.svelte";

  const configuration = window.ctxProcess.configuration();

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

  function handleAddVirtualModuleClicked(e) {
    new Modal.Window(AddVirtualModule).show({ dx: 0, dy: 0 });
    Analytics.track({
      event: "VirtualModule",
      payload: {
        message: "Virtual Module modal opened",
      },
      mandatory: true,
    });
  }
</script>

<div class={$$props.class}>
  <div
    style="background-color: var(--background); color: var(--foreground); border: solid var(--border); border-radius: var(--radius);"
    class="flex flex-col rounded-md shadow-xl w-64 p-4 relative"
  >
    {#if import.meta.env.VITE_BUILD_TARGET === "web"}
      <div class="flex flex-col">
        <span class="text-xl text-center mb-4">Connect your modules!</span>
        <SvgIcon width={10} height={10} fill={"#FFF"} iconPath="disabled" />
        <span class="text-sm mt-4">
          To connect modules, press Connect to enable Grid Editor access USB.
          Each module must be enabled separately.
        </span>
        <span style="color: var(--foreground-muted)" class="text-sm"
          >(Only supported in Edge, Opera and Google Chrome)</span
        >
      </div>
      <div class="flex flex-col gap-2 mt-4">
        <MoltenPushButton
          text="Add Virtual Module"
          style="accept"
          snap={"full"}
          click={handleAddVirtualModuleClicked}
        />
      </div>
    {:else}
      <div class="flex flex-col">
        <span class="text-xl text-center">No connected modules!</span>
        <div class="flex flex-row items-center scale-75 gap-8 -my-12 -ml-3">
          <div class="w-10 h-40 mt-16">
            <svg
              style="color: var(--foreground-muted)"
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              class="fill-current"
              width="200"
              viewBox="0 0 190 80"
              xml:space="preserve"
            >
              <!-- cable -->
              <g
                transform="translate(112,-10) rotate(90) scale(1.8) translate(-25.5,-8.6)"
              >
                <g transform="translate(45,13)">
                  <path
                    fill-rule="evenodd"
                    d="M3.5,24 L2,24 L2,13.5 L8,13.5 L8,24 L6.5,24 L3.5,24 Z M3.5,24.5 L6.5,24.5 L6.5,87 L3.5,87 L3.5,24.5 Z M2,13 L0,13 L0,0 L10,0 L10,13 L8,13 L2,13 Z"
                  />
                </g>
                <path
                  fill-rule="nonzero"
                  d="M53.75,12.75 L53.75,6 C53.75,5.58578644 53.4142136,5.25 53,5.25 L47,5.25 C46.5857864,5.25 46.25,5.58578644 46.25,6 L46.25,12.75 L53.75,12.75 Z M47,4.75 L53,4.75 C53.6903559,4.75 54.25,5.30964406 54.25,6 L54.25,13.25 L45.75,13.25 L45.75,6 C45.75,5.30964406 46.3096441,4.75 47,4.75 Z"
                />
              </g>
              <!-- USB-C port-->
              <g
                transform="translate(150,40) rotate(90) scale(1.5) translate(-12,-8.6)"
              >
                <g transform="translate(0,-280.06665)">
                  <path
                    d="m 3.5585938,285.24023 c -1.6689716,0 -3.02929692,1.36033 -3.02929692,3.0293 v 0.52735 c 0,1.66897 1.36032532,3.02929 3.02929692,3.02929 H 13.375 c 1.668972,0 3.029297,-1.36032 3.029297,-3.02929 v -0.52735 c 0,-1.66897 -1.360325,-3.0293 -3.029297,-3.0293 z m 0,1.0586 H 13.375 c 1.100961,0 1.970703,0.86974 1.970703,1.9707 v 0.52735 c 0,1.10096 -0.869742,1.9707 -1.970703,1.9707 H 3.5585938 c -1.1009611,0 -1.9707032,-0.86974 -1.9707032,-1.9707 v -0.52735 c 0,-1.10096 0.8697421,-1.9707 1.9707032,-1.9707 z"
                  />
                  <path
                    d="m 3.7089844,288.00391 a 0.529295,0.529295 0 1 0 0,1.05859 h 9.5156246 a 0.529295,0.529295 0 1 0 0,-1.05859 z"
                  />
                </g>
              </g>
            </svg>
          </div>
          <div class="w-0">
            <svg
              style="color: var(--foreground-muted)"
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              class="fill-current rotate-90"
              viewBox="0 0 100 125"
              xml:space="preserve"
            >
              <!-- port housing (outer pill minus inner cavity) -->
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M18 36 h64 a14 14 0 0 1 0 28 h-64 a14 14 0 0 1 0 -28 z
         M22 43 a7 7 0 0 0 0 14 h56 a7 7 0 0 0 0 -14 z"
              />
              <!-- tongue -->
              <rect x="30" y="46" width="40" height="8" rx="4" />
            </svg>
          </div>
        </div>
        <span class="text-sm">
          Try reconnecting your Grid module by unplugging it, then plugging it
          in.
        </span>
      </div>
      <div class="flex flex-col gap-2 mt-4">
        <MoltenPushButton
          click={handleTroubleshoot}
          style={"outlined"}
          text="Troubleshooting"
          snap={"full"}
        />
        <MoltenPushButton
          text="Add Virtual Module"
          style="accept"
          snap={"full"}
          click={handleAddVirtualModuleClicked}
        />
      </div>
    {/if}
  </div>
</div>

<style>
</style>
