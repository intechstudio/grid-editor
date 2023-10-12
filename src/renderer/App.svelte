<script>
  import "./app.css";

  import { Pane, Splitpanes } from "svelte-splitpanes";

  import { onMount } from "svelte";

  import { appSettings, splitpanes } from "./runtime/app-helper.store";

  import "./runtime/analytics.js";

  import Titlebar from "./main/Titlebar.svelte";
  import NavTabs from "./main/NavTabs.svelte";

  import RightPanelContainer from "./main/RightPanelContainer.svelte";
  import LeftPanelContainer from "./main/LeftPanelContainer.svelte";
  import GridLayout from "./main/grid-layout/GridLayout.svelte";

  import Export from "./main/modals/Export.svelte";
  import Welcome from "./main/modals/Welcome.svelte";
  import Monaco from "./main/modals/Monaco.svelte";
  import Feedback from "./main/modals/Feedback.svelte";
  import ProfileAttachment from "./main/modals/ProfileAttachment.svelte";

  import FirmwareCheck from "./main/FirmwareCheck.svelte";

  import ErrorConsole from "./main/ErrorConsole.svelte";

  import Updater from "./shared/updater/Updater.svelte";

  import { windowSize } from "./runtime/window-size";

  import { authStore } from "$lib/auth.store";
  import { configLinkStore } from "$lib/configlink.store";

  import { watchResize } from "svelte-watch-resize";
  import { debug_lowlevel_store } from "./main/panels/WebsocketMonitor/WebsocketMonitor.store";
  import UserLogin from "./main/modals/UserLogin.svelte";
  import Pages from "./main/panels/configuration/components/Pages.svelte";
  import CursorLog from "./main/user-interface/cursor-log/CursorLog.svelte";
  import Tracker from "./main/user-interface/Tracker.svelte";
  import ActiveChanges from "./main/user-interface/ActiveChanges.svelte";
  import ModulConnectionDialog from "./main/user-interface/ModulConnectionDialog.svelte";
  import { runtime, logger } from "./runtime/runtime.store";
  import { writeBuffer } from "./runtime/engine.store.js";
  import { fade, blur, fly, slide, scale } from "svelte/transition";
  import Spinner from "./main/user-interface/Spinner.svelte";
  import { setTooltip } from "./main/user-interface/tooltip/Tooltip";
  import { Analytics } from "./runtime/analytics.js";
  import SendFeedback from "./main/user-interface/SendFeedback.svelte";

  const configuration = window.ctxProcess.configuration();

  let modalComponents = {};

  modalComponents[""] = undefined;
  modalComponents["export"] = Export;
  modalComponents["welcome"] = Welcome;
  modalComponents["code"] = Monaco;
  modalComponents["feedback"] = Feedback;
  modalComponents["profileAttachment"] = ProfileAttachment;
  modalComponents["userLogin"] = UserLogin;

  let shapeSelected;
  let colorSelected;
  let name;

  $: {
    if ($appSettings.persistent.helperShape !== undefined) {
      shapeSelected = $appSettings.persistent.helperShape;
    }

    if ($appSettings.persistent.helperColor !== undefined) {
      colorSelected = $appSettings.persistent.helperColor;
    }

    name = $appSettings.persistent.helperName;
  }

  function resize() {
    $windowSize.window = $windowSize.window + 1;
  }

  // websocket rx tx from main for debug
  window.electron.websocket.onReceive((_event, value) => {
    //console.log('websocket',value);
    debug_lowlevel_store.push_inbound(new TextEncoder().encode(value));
  });

  window.electron.websocket.onTransmit((_event, value) => {
    //console.log('websocket',value);
    debug_lowlevel_store.push_outbound(new TextEncoder().encode(value));
  });

  window.electron.auth.onExternalResponse((_event, value) => {
    authStore.socialLogin("google", value);
  });

  window.electron.configs.onExternalResponse((_event, value) => {
    // listening to this store on ProfileCloud.svelte
    profileLinkStore.set({ id: value });
  });

  window.onmessage = (event) => {
    // extract this part on refactor
    if (event.source === window && event.data === "plugin-manager-port") {
      const [port] = event.ports;
      window.pluginManagerPort = port;
      // register message handler
      port.onmessage = (event) => {
        const data = event.data;
        // action towards runtime
        switch (data.type) {
          case "plugin-action": {
            if (data.id == "change-page") {
              runtime.change_page(data.num);
            } else if (data.id == "persist-data") {
              appSettings.update((s) => {
                const newStorage = structuredClone(
                  s.persistent.pluginsDataStorage
                );
                newStorage[data.pluginId] = data.data;
                s.persistent.pluginsDataStorage = newStorage;
                return s;
              });
            }
            break;
          }
          case "plugins": {
            // refresh pluginlist
            const markedForDeletionPlugins = data.plugins
              .filter((e) => e.status == "MarkedForDeletion")
              .map((e) => e.id);
            const enabledPlugins = data.plugins
              .filter((e) => e.status == "Enabled")
              .map((e) => e.id);
            appSettings.update((s) => {
              s.pluginList = data.plugins;
              s.persistent.markedForDeletionPlugins = markedForDeletionPlugins;
              s.persistent.enabledPlugins = enabledPlugins;
              return s;
            });
            break;
          }
          case "refresh-plugins": {
            const env = process.env.NODE_ENV;
            break;
          }
          default: {
            console.info(
              `Unhandled message type of ${data.type} received on port ${port}`
            );
          }
        }
      };
      for (const plugin of $appSettings.persistent.markedForDeletionPlugins ??
        []) {
        port.postMessage({ type: "uninstall-plugin", id: plugin });
      }
      for (const plugin of $appSettings.persistent.enabledPlugins ?? []) {
        port.postMessage({
          type: "load-plugin",
          id: plugin,
          payload: $appSettings.persistent.pluginsDataStorage[plugin],
        });
      }
      // register global createPluginMessagePort for direct plugin communication
      window.createPluginMessagePort = (id) => {
        const channel = new MessageChannel();
        port.postMessage({ type: "create-plugin-message-port", id }, [
          channel.port1,
        ]);
        return channel.port2;
      };
    }
  };

  let leftPaneSize;
  function handlePaneResize(event) {
    if (event.detail[0].size > leftPaneSize) {
      // when left panel is resized to > 0, make leftpanel visible
      appSettings.update((store) => {
        store.leftPanelVisible = true;
        return store;
      });
    }
    $splitpanes.left = event.detail[0].size;
  }

  function handlePaneResized(event) {
    event.detail.forEach((pane, index) => {
      // left pane
      if (index == 0) {
        if (pane.size == 0) {
          // when left panel is resized to 0, make leftpanel invisible
          appSettings.update((store) => {
            store.leftPanelVisible = false;
            return store;
          });
        }
        leftPaneSize = pane.size;
      }
      // middle pane
      if (index == 1) {
        $splitpanes.middle = pane.size;
      }
      // right pane
      if (index == 2) {
        $splitpanes.right = pane.size;
      }
    });
  }

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
</script>

<Titlebar />

<main
  use:watchResize={resize}
  id="app"
  spellcheck="false"
  class="dark relative flex w-full h-full flex-row justify-between overflow-hidden"
>
  <!-- Switch between tabs for different application features. -->
  <NavTabs />

  <svelte:component this={modalComponents[$appSettings.modal]} />

  <!-- Update notification -->
  <Updater />

  <div class="flex flex-col w-full h-full">
    <FirmwareCheck />

    <ErrorConsole />

    <div class="flex flex-grow overflow-hidden">
      <Splitpanes theme="modern-theme" class="w-full">
        <Pane
          class="leftPane"
          bind:size={$splitpanes.left.size}
          minSize={$splitpanes.left.default}
          maxSize={45}
        >
          <LeftPanelContainer />
        </Pane>

        <Pane class="overflow-clip w-full h-full">
          <div
            class="relative flex w-full h-full overflow-clip items-center justify-center"
          >
            <GridLayout class="relative w-full h-full flex flex-col">
              <Pages class="w-full z-[1]" />
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
                          >One of your modules is not responding. Abort the
                          active configuration process?
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
                          >One of your modules is still not responding. Abort or
                          try troubleshooting.
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
                <ActiveChanges class="w-fit self-center mt-10 " />
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
                  class="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4"
                  on:content-change={handleContentChange}
                />
              </div>
            </GridLayout>
          </div>
        </Pane>

        <Pane
          bind:size={$splitpanes.right.size}
          minSize={$splitpanes.right.default}
          maxSize={45}
        >
          <RightPanelContainer />
        </Pane>
      </Splitpanes>
    </div>
  </div>
</main>

<style global>
  .splitpanes.modern-theme .splitpanes__pane {
    /*  @apply bg-secondary; */
    position: relative;
    overflow: visible;
  }

  /*betty magic selector*/
  .splitpanes.modern-theme .splitpanes__pane.leftPane {
    overflow: hidden;
  }

  .splitpanes.modern-theme .splitpanes__splitter {
    background-color: #4c4c4c;
    position: relative;
  }
  .splitpanes.modern-theme .splitpanes__splitter:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    transition: opacity 0.3s;
    background-color: #2db9d2;
    width: 200;
    opacity: 0;
    z-index: 1;
  }
  .splitpanes.modern-theme .splitpanes__splitter:hover:before {
    opacity: 1;
  }
  .splitpanes.modern-theme .splitpanes__splitter.splitpanes__splitter__active {
    z-index: 2;
    /* Fix an issue of overlap fighting with a near hovered splitter */
  }
  .modern-theme.splitpanes--vertical > .splitpanes__splitter:before {
    left: -3px;
    right: -3px;
    height: 100%;
    cursor: col-resize;
  }
  .modern-theme.splitpanes--horizontal > .splitpanes__splitter:before {
    top: -3px;
    bottom: -3px;
    width: 100%;
    cursor: row-resize;
  }
  .splitpanes.no-splitter .splitpanes__pane {
    background-color: #0e100f;
  }
  .splitpanes.no-splitter .splitpanes__splitter {
    background-color: #4c4c4c;
    position: relative;
  }
  .no-splitter.splitpanes--horizontal > .splitpanes__splitter:before {
    width: 0.05rem;
    pointer-events: none;
    cursor: none;
  }
  .no-splitter.splitpanes--vertical > .splitpanes__splitter:before {
    height: 0.05rem;
    pointer-events: none;
    cursor: none;
  }
</style>
