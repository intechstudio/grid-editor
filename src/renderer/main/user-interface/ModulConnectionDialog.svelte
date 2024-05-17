<script>
  import { modal } from "./../modals/modal.store";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { Analytics } from "../../runtime/analytics.js";
  import SendFeedback from "./SendFeedback.svelte";
  import AddVirtualModule from "../modals/AddVirtualModule.svelte";
  import SvgIcon from "./SvgIcon.svelte";

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
    modal.show({ component: AddVirtualModule, args: { dx: 0, dy: 0 } });
    Analytics.track({
      event: "VirtualModule",
      payload: {
        message: "Virtual Module modal opened",
      },
      mandatory: true,
    });
  }

  function handleConnectModules(e) {
    navigator.intechConnect();
  }
</script>

<div class={$$props.class}>
  <div class="flex flex-col bg-primary rounded-md shadow-xl w-64 p-4 relative">
    {#if window.ctxProcess.buildVariables().BUILD_TARGET === "web"}
      <div class="flex flex-col">
        <span class="text-xl text-white text-center mb-4"
          >Connect your modules!</span
        >
        <SvgIcon width={"100%"} height={25} fill={"#FFF"} iconPath="disabled" />
        <span class="text-white text-sm mt-4">
          Enable module connection by enabling Grid Editor to access USB!
        </span>
      </div>
      <div class="flex flex-col gap-2 mt-4">
        <MoltenPushButton
          text="Enable Module Connect"
          snap={"full"}
          style={"outlined"}
          click={handleConnectModules}
        />
        <MoltenPushButton
          text="Add Virtual Module"
          style="accept"
          snap={"full"}
          click={handleAddVirtualModuleClicked}
        />
      </div>
    {:else}
      <div class="flex flex-col">
        <span class="text-xl text-white text-center">No connected modules!</span
        >
        <div class="flex flex-row items-center scale-75 gap-8 -my-12 -ml-3">
          <div class="w-32 test">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              version="1.1"
              class="text-white fill-current rotate-90 mt-2"
              viewBox="0 0 100 125"
              enable-background="new 0 0 100 100"
              xml:space="preserve"
              ><path
                d="M56.776,2.204h-21.02v23.232h21.02V2.204z M45.16,14.373h-6.638V7.735h6.638V14.373z M54.01,14.373h-6.637V7.735h6.637  V14.373z"
              /><polygon
                points="62.446,25.989 30.086,25.989 30.086,48.945 45.505,48.945 45.852,48.945 62.377,48.945 62.377,49.774   62.446,49.774 "
              /><path
                d="M40.401,61.719l5.104-0.38V49.774H30.086v8.298l3.319,11.616h8.17c-0.065-0.378-0.132-0.756-0.199-1.138  C40.979,66.308,40.569,63.99,40.401,61.719z"
              /><rect
                x="30.086"
                y="48.945"
                width="15.419"
                height="0.829"
              /><path
                d="M45.852,61.313l3.377-0.25c0.134,1.826,0.488,3.827,0.863,5.946c0.156,0.877,0.311,1.772,0.458,2.679h8.508l3.319-11.616  v-8.298H45.852V61.313z"
              /><rect
                x="45.852"
                y="48.945"
                width="16.525"
                height="0.829"
              /><polygon
                points="45.505,61.339 45.852,61.313 45.852,49.774 45.505,49.774 "
              /><rect x="45.505" y="48.945" width="0.346" height="0.829" /><path
                d="M45.505,69.688h-3.93c0.839,4.818,1.445,9.323-0.575,12.691c-1.267,2.154-7.34,5.248-11.233,6.652l2.991,8.33  c2.053-0.736,12.465-4.705,15.851-10.463c3.324-5.539,2.85-11.605,1.941-17.211h-4.698H45.505z"
              /><path
                d="M45.505,61.339l-5.104,0.38c0.168,2.271,0.578,4.589,0.975,6.832c0.067,0.382,0.134,0.76,0.199,1.138h3.93V61.339z"
              /><path
                d="M49.229,61.063l-3.377,0.25v8.375h4.698c-0.147-0.906-0.303-1.802-0.458-2.679C49.716,64.891,49.363,62.89,49.229,61.063z"
              /><polygon
                points="45.505,69.688 45.852,69.688 45.852,61.313 45.505,61.339 "
              /></svg
            >
          </div>
          <div class="w-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              version="1.1"
              class="text-white fill-current rotate-90"
              viewBox="0 0 100 125"
              enable-background="new 0 0 100 100"
              xml:space="preserve"
              ><g
                ><path
                  d="M14,59.25h72c0.414,0,0.75-0.336,0.75-0.75V50h-73.5v8.5C13.25,58.914,13.587,59.25,14,59.25z"
                /><path
                  d="M10.5,67.25h79c2.895,0,5.25-2.355,5.25-5.25V38c0-2.895-2.355-5.25-5.25-5.25h-79c-2.895,0-5.25,2.355-5.25,5.25v24   C5.25,64.895,7.605,67.25,10.5,67.25z M11.75,41.5c0-1.24,1.01-2.25,2.25-2.25h72c1.241,0,2.25,1.01,2.25,2.25v17   c0,1.241-1.009,2.25-2.25,2.25H14c-1.24,0-2.25-1.009-2.25-2.25V41.5z"
                /></g
              ></svg
            >
          </div>
        </div>
        <span class="text-white text-sm">
          Try reconnecting your Grid module by unplugging it, then plugging it
          in.
        </span>
        <SendFeedback
          feedback_context="Module not responding"
          class="self-start text-gray-500 text-sm"
        />
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
  .test {
    animation-name: test-animate;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: alternate-reverse;
  }

  @keyframes test-animate {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(18px, 0);
    }
  }
</style>
