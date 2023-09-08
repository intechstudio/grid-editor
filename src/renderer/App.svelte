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
  import ProfileInfo from "./main/modals/ProfileInfo.svelte";
  import ProfileAttachment from "./main/modals/ProfileAttachment.svelte";
  import ProfileEdit from "./main/modals/ProfileEdit.svelte";
  import PresetInfo from "./main/modals/PresetInfo.svelte";
  import PresetEdit from "./main/modals/PresetEdit.svelte";

  import FirmwareCheck from "./main/FirmwareCheck.svelte";

  import ErrorConsole from "./main/ErrorConsole.svelte";

  import Updater from "./shared/updater/Updater.svelte";

  import { windowSize } from "./runtime/window-size";

  import { authStore } from "$lib/auth.store";
  import { profileLinkStore } from "$lib/profilelink.store";

  import { watchResize } from "svelte-watch-resize";
  import { debug_lowlevel_store } from "./main/panels/WebsocketMonitor/WebsocketMonitor.store";
  import UserLogin from "./main/modals/UserLogin.svelte";
  import Pages from "./main/panels/configuration/components/Pages.svelte";
  import CursorLog from "./main/user-interface/cursor-log/CursorLog.svelte";
  import Tracker from "./main/user-interface/Tracker.svelte";
  import ActiveChanges from "./main/user-interface/ActiveChanges.svelte";
  import ModulConnectionDialog from "./main/user-interface/ModulConnectionDialog.svelte";
  import { runtime } from "./runtime/runtime.store";
  import { fade, blur, fly, slide, scale } from "svelte/transition";

  let modalComponents = {};

  modalComponents[""] = undefined;
  modalComponents["export"] = Export;
  modalComponents["welcome"] = Welcome;
  modalComponents["code"] = Monaco;
  modalComponents["feedback"] = Feedback;
  modalComponents["profileInfo"] = ProfileInfo;
  modalComponents["profileAttachment"] = ProfileAttachment;
  modalComponents["profileEdit"] = ProfileEdit;
  modalComponents["presetInfo"] = PresetInfo;
  modalComponents["presetEdit"] = PresetEdit;
  modalComponents["userLogin"] = UserLogin;

  let shapeSelected;
  let colorSelected;
  let name;

  $: {
    if ($appSettings.persistant.helperShape !== undefined) {
      shapeSelected = $appSettings.persistant.helperShape;
    }

    if ($appSettings.persistant.helperColor !== undefined) {
      colorSelected = $appSettings.persistant.helperColor;
    }

    name = $appSettings.persistant.helperName;
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
        if (data.type == "plugin-action") {
          if (data.id == "change-page") {
            runtime.change_page(data.num);
          } else if (data.id == "persist-data") {
            appSettings.update((s) => {
              const newStorage = structuredClone(
                s.persistant.pluginsDataStorage
              );
              newStorage[data.pluginId] = data.data;
              s.persistant.pluginsDataStorage = newStorage;
              return s;
            });
          }
        } else if (data.type == "plugins") {
          // refresh pluginlist
          const markedForDeletionPlugins = data.plugins
            .filter((e) => e.status == "MarkedForDeletion")
            .map((e) => e.id);
          const enabledPlugins = data.plugins
            .filter((e) => e.status == "Enabled")
            .map((e) => e.id);
          appSettings.update((s) => {
            s.pluginList = data.plugins;
            s.persistant.markedForDeletionPlugins = markedForDeletionPlugins;
            s.persistant.enabledPlugins = enabledPlugins;
            return s;
          });
        }
      };
      for (const plugin of $appSettings.persistant.markedForDeletionPlugins ??
        []) {
        port.postMessage({ type: "uninstall-plugin", id: plugin });
      }
      for (const plugin of $appSettings.persistant.enabledPlugins ?? []) {
        port.postMessage({
          type: "load-plugin",
          id: plugin,
          payload: $appSettings.persistant.pluginsDataStorage[plugin],
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

  onMount(() => {});

  let trackerVisible = true;

  function handleContentChange(e) {
    const { DOMElementCount } = e.detail;
    trackerVisible = DOMElementCount === 0;
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
            <GridLayout class="relative w-full h-full flex flex-col z-1">
              <Pages class="w-full z-10" />

              <ActiveChanges class="w-fit self-center mt-10 z-10" />

              {#if $runtime.length == 0 && $appSettings.firmwareNotificationState === 0}
                <div
                  in:fade|global={{ delay: 2000, duration: 1000 }}
                  out:blur|global={{ duration: 150 }}
                  class="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2"
                >
                  <ModulConnectionDialog />
                </div>
              {/if}

              <div class="flex h-ful z-10l">
                <div
                  in:fly|global={{ x: -10 }}
                  out:fly|global={{ x: 10 }}
                  class="w-fit {trackerVisible
                    ? ''
                    : 'hidden'} absolute right-0 bottom-0 mb-12 mr-10"
                >
                  <Tracker />
                </div>
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
