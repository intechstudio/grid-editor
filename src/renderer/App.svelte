<script>
  import { modal } from "./main/modals/modal.store";

  import "./preload-window-config";

  import "./app.css";

  import { Pane, Splitpanes } from "svelte-splitpanes";

  import { appSettings, splitpanes } from "./runtime/app-helper.store";

  import "./runtime/analytics.js";

  import Titlebar from "./main/Titlebar.svelte";
  import NavTabs from "./main/NavTabs.svelte";

  import RightPanelContainer from "./main/RightPanelContainer.svelte";
  import LeftPanelContainer from "./main/LeftPanelContainer.svelte";

  import FirmwareCheck from "./main/FirmwareCheck.svelte";

  import ErrorConsole from "./main/ErrorConsole.svelte";

  import { windowSize } from "./runtime/window-size";

  import { authStore } from "$lib/auth.store";
  import { configLinkStore } from "$lib/configlink.store";

  import { watchResize } from "svelte-watch-resize";
  import { debug_lowlevel_store } from "./main/panels/WebsocketMonitor/WebsocketMonitor.store";

  import { runtime, logger } from "./runtime/runtime.store";

  import MiddlePanelContainer from "./main/MiddlePanelContainer.svelte";
  import { addPackageAction, removePackageAction } from "./lib/_configs";
  import { onDestroy, onMount } from "svelte";
  import {
    setDocumentAnimationsEnabled,
    reduced_motion_store,
  } from "../renderer/runtime/animations";

  import { instructions } from "./serialport/instructions";
  import VersionUpdateBar from "./main/VersionUpdateBar.svelte";

  console.log("Hello from Svelte main.js");

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
    configLinkStore.set({ id: value });
  });

  window.onmessage = (event) => {
    // extract this part on refactor
    if (event.source === window && event.data === "package-manager-port") {
      const [port] = event.ports;
      window.packageManagerPort = port;
      // register message handler
      port.onmessage = (event) => {
        $appSettings.packageManagerRunning = true;
        const data = event.data;
        // action towards runtime
        switch (data.type) {
          case "persist-data": {
            appSettings.update((s) => {
              const newStorage = structuredClone(
                s.persistent.packagesDataStorage
              );
              newStorage[data.packageId] = data.data;
              s.persistent.packagesDataStorage = newStorage;
              return s;
            });
            break;
          }
          case "execute-lua-script":
            console.log(`Sending script: ${data.script}`);
            instructions
              .sendImmediateToGrid(
                data.targetDx ?? -127,
                data.targetDy ?? -127,
                data.script
              )
              .catch((e) => {
                console.warn(e);
              });
          break;
          case "add-action": {
            addPackageAction({
              ...data.info,
              packageId: data.packageId,
            });
            break;
          }
          case "remove-action": {
            removePackageAction(data.packageId, data.actionId);
            break;
          }
          case "change-page": {
            runtime.change_page(data.num);
            break;
          }
          case "persist-github-package": {
            appSettings.update((s) => {
              let persistent = structuredClone(s.persistent);
              persistent.githubPackages[data.id] = {
                name: data.packageName,
                gitHubRepositoryOwner: data.gitHubRepositoryOwner,
                gitHubRepositoryName: data.gitHubRepositoryName,
              };
              s.persistent = persistent;
              return s;
            });
            break;
          }
          case "remove-github-package": {
            appSettings.update((s) => {
              let persistent = structuredClone(s.persistent);
              delete persistent.githubPackages[data.id];
              s.persistent = persistent;
              return s;
            });
            break;
          }
          case "packages": {
            // refresh packagelist
            const enabledPackages = data.packages
              .filter((e) => e.status == "Enabled");
            for (const _package of enabledPackages){
              if (_package.componentsPath){
                console.log(`Importing ${_package.componentsPath}`);
                import(`package://${_package.componentsPath}`);
              }
            }
            appSettings.update((s) => {
              s.packageList = data.packages;
              s.persistent.enabledPackages = enabledPackages.map((e) => e.id);
              return s;
            });
            break;
          }
          case "show-message": {
            logger.set({
              message: data.message,
              type: data.messageType,
            });
            break;
          }
          case "debug-error": {
            console.log(`Package error: ${data.error}`);
            break;
          }
          default: {
            console.info(
              `Unhandled message type of ${
                data.type
              } received on port, data: ${JSON.stringify(data)}`
            );
          }
        }
      };
      port.onclose = () => {
        //Clear package list without deleting enabled packages
        $appSettings.packageList = [];
        $appSettings.packageManagerRunning = false;
      };
      for (const _package of $appSettings.persistent.enabledPackages ?? []) {
        port.postMessage({
          type: "load-package",
          id: _package,
          payload: $appSettings.persistent.packagesDataStorage[_package],
        });
      }
      // register global createPackageMessagePort for direct package communication
      window.createPackageMessagePort = (id, senderId) => {
        const channel = new MessageChannel();
        port.postMessage(
          { type: "create-package-message-port", id, senderId },
          [channel.port1]
        );
        return channel.port2;
      };
    }
  };

  function handleDisableAnimationsChange(settingValue, reducedValue) {
    switch (settingValue) {
      case "auto": {
        setDocumentAnimationsEnabled(!reducedValue);
        break;
      }
      case "enabled": {
        setDocumentAnimationsEnabled(true);
        break;
      }
      case "disabled": {
        setDocumentAnimationsEnabled(false);
        break;
      }
    }
  }

  //Disable Context Menu
  onMount(() => {
    document.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
  });

  onDestroy(() => {
    document.removeEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
  });

  $: handleDisableAnimationsChange(
    $appSettings.persistent.disableAnimations,
    $reduced_motion_store
  );
</script>

{#if window.ctxProcess.buildVariables().BUILD_TARGET !== "web"}
  <Titlebar />
{/if}

<main
  use:watchResize={resize}
  id="app"
  spellcheck="false"
  class="dark relative flex w-full h-full flex-row justify-between overflow-hidden"
  style="font-size:{$appSettings.persistent.fontSize}px;"
>
  <!-- Switch between tabs for different application features. -->
  <NavTabs />

  {#if $modal?.options.snap === "full"}
    <svelte:component this={$modal?.component} />
  {/if}

  <div class="flex flex-col w-full h-full">
    <FirmwareCheck />

    <ErrorConsole />
    <VersionUpdateBar />

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
          {#if $modal?.options.snap === "middle"}
            <svelte:component this={$modal?.component} reference={3} />
          {:else}
            <MiddlePanelContainer />
          {/if}
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
