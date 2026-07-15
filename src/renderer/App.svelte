<script lang="ts">
  import { Modal, modalManager } from "./main/modals/modal.store";

  import "./preload-window-config";

  import "@intechstudio/grid-uikit/theme.css";
  import "./app.css";

  import { Pane, Splitpanes } from "svelte-splitpanes";

  import { appSettings, splitpanes } from "./runtime/app-helper.store";

  import Titlebar from "./main/Titlebar.svelte";
  import NavTabs from "./main/NavTabs.svelte";

  import RightPanelContainer from "./main/RightPanelContainer.svelte";
  import LeftPanelContainer from "./main/LeftPanelContainer.svelte";

  import FirmwareMismatchNotification from "./main/FirmwareMismatchNotification.svelte";
  import LegacyCompletionNotification from "./main/LegacyCompletionNotification.svelte";
  import WebSocketNotification from "./main/WebSocketNotification.svelte";

  import ErrorConsole from "./main/ErrorConsole.svelte";

  import QuitApp from "./main/modals/QuitApp.svelte";

  import { windowSize } from "./runtime/window-size.svelte";

  import { authStore } from "$lib/auth.store";
  import { configLinkStore } from "$lib/configlink.store";

  import { watchResize } from "svelte-watch-resize";
  import { debug_lowlevel_store } from "./main/panels/WebsocketMonitor/WebsocketMonitor.store";

  import { logger } from "./runtime/runtime.store";
  import { logStreamStore } from "./main/user-interface/cursor-log/LogStream.store";

  import MiddlePanelContainer from "./main/MiddlePanelContainer.svelte";
  import PanelToggleButton from "./main/PanelToggleButton.svelte";
  import { addPackageAction, removePackageAction } from "./lib/_configs";
  import { onDestroy, onMount } from "svelte";
  import AnimationToggle from "./main/AnimationToggle.svelte";
  import Analytics from "./main/Analytics.svelte";

  import VersionUpdateBar from "./main/VersionUpdateBar.svelte";
  import "redefine-custom-elements";
  import { runtime_manager } from "./runtime/runtime-manager.store";
  import { get } from "svelte/store";

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

  $: handleColorModeChange($appSettings.persistent.lightMode);
  function handleColorModeChange(value: boolean) {
    document.documentElement.setAttribute(
      "color-scheme",
      value ? "light" : "dark",
    );
  }

  function resize() {
    windowSize.window = windowSize.window + 1;
  }

  // websocket rx tx from main for debug
  window.electron.websocket.onReceive((_event, value) => {
    debug_lowlevel_store.push_inbound(new TextEncoder().encode(value));
  });

  window.electron.websocket.onTransmit((_event, value) => {
    debug_lowlevel_store.push_outbound(new TextEncoder().encode(value));
  });

  window.electron.auth.onExternalResponse((_event, value) => {
    authStore.socialLogin("google", value);
  });

  window.electron.configs.onExternalResponse((_event, value) => {
    // listening to this store on ProfileCloud.svelte
    configLinkStore.set({ id: value });
  });

  window.electron.showQuitDialog((_event, value) => {
    new Modal.Window(QuitApp).show();
  });

  async function handlePackageManagerMessage(event) {
    $appSettings.packageManagerRunning = true;
    const data = event.data;
    // action towards runtime
    if ($appSettings.persistent.packageDeveloper) {
      $appSettings.packageDebugLogs.push({
        time: new Date(),
        ...data,
      });
      $appSettings.packageDebugLogs = [...$appSettings.packageDebugLogs];
    }
    switch (data.type) {
      case "persist-data": {
        appSettings.update((s) => {
          const newStorage = structuredClone(s.persistent.packagesDataStorage);
          newStorage[data.packageId] = data.data;
          s.persistent.packagesDataStorage = newStorage;
          return s;
        });
        break;
      }
      case "execute-lua-script":
        console.log(`Sending script: ${data.script}`);
        runtime_manager.LUAExecImmediate(
          data.targetDx ?? -127,
          data.targetDy ?? -127,
          data.script,
        );
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
        get(runtime_manager)
          .active.runtime.change_page(data.num)
          .catch((e) => {
            //Silently handle exception if operation is not available
            console.error(e);
          });
        break;
      }
      case "persist-github-package": {
        appSettings.update((s) => {
          let persistent = structuredClone(s.persistent);
          persistent.githubPackages[data.packageId] = {
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
          delete persistent.githubPackages[data.packageId];
          s.persistent = persistent;
          return s;
        });
        break;
      }
      case "persist-local-package": {
        appSettings.update((s) => {
          let persistent = structuredClone(s.persistent);
          persistent.localPackages[data.packageId] = data.rootPath;
          s.persistent = persistent;
          return s;
        });
        break;
      }
      case "remove-local-package": {
        appSettings.update((s) => {
          let persistent = structuredClone(s.persistent);
          delete persistent.localPackages[data.packageId];
          s.persistent = persistent;
          return s;
        });
        break;
      }
      case "packages": {
        // refresh packagelist
        const enabledPackages = data.packages.filter((e) => e.isEnabled);
        for (const _package of enabledPackages) {
          if (_package.componentsPath) {
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
      case "request-developer-package":
        appSettings.update((s) => {
          let list = s.developerPackagesRequested ?? [];
          let newList = list.filter((e) => e.id != data.id);
          newList.push({
            id: data.id,
            name: data.name,
            rootPath: data.rootPath,
          });
          s.developerPackagesRequested = newList;
          return s;
        });
        logger.set({
          message: `New developer package: ${data.name}. Approve at Packages tab!`,
          type: "progress",
        });
        break;
      case "reload-package-components":
        let packageInfo = $appSettings.packageList.find((e) => e.id == data.id);
        if (
          packageInfo.loadable &&
          !$appSettings.persistent.enabledPackages.includes(data.id)
        )
          return;
        if (!packageInfo.componentsPath) return;

        let versionKey = new Date().getTime();
        await import(`package://v${versionKey}/${packageInfo.componentsPath}`);
        appSettings.update((s) => {
          s.packageComponentKeys[data.id] = versionKey;
          return s;
        });
        break;
      case "show-message": {
        logger.set({
          message: data.message,
          type: data.messageType,
        });
        break;
      }
      case "debug-error": {
        console.log(`Package error: ${JSON.stringify(data)}`);
        break;
      }
      default: {
        console.info(
          `Unhandled message type of ${
            data.type
          } received on port, data: ${JSON.stringify(data)}`,
        );
      }
    }
  }

  window.onmessage = (event) => {
    // extract this part on refactor
    if (event.source === window && event.data === "package-manager-port") {
      const [port] = event.ports;
      if (window.packageManagerPort) {
        window.packageManagerPort.close();
      }
      window.packageManagerPort = port;
      // register message handler
      port.onmessage = handlePackageManagerMessage;
      port.onclose = () => {
        //Clear package list without deleting enabled packages
        $appSettings.packageList = [];
        $appSettings.packageManagerRunning = false;
      };
      // register global createPackageMessagePort for direct package communication
      window.createPackageMessagePort = (id, senderId) => {
        const channel = new MessageChannel();
        port.postMessage(
          { type: "create-package-message-port", id, senderId },
          [channel.port1],
        );
        return channel.port2;
      };
    }
  };

  let loaded = false;

  //Disable Context Menu
  onMount(async () => {
    document.addEventListener("contextmenu", preventContextMenuEvent);
    // Test-only seam: let the (web build) e2e suite reset transient UI state —
    // notification toasts that otherwise linger ~5s and bleed across tests.
    if (import.meta.env.VITE_BUILD_TARGET === "web") {
      (window as any).__gridTest = {
        ...(window as any).__gridTest,
        resetLogStream: () => logStreamStore.reset(),
      };
    }
    loaded = true;
    window.electron.appLoaded();
  });

  onDestroy(() => {
    document.removeEventListener("contextmenu", preventContextMenuEvent);
  });

  function preventContextMenuEvent(e) {
    e.preventDefault();
  }

  function handleRightPanelToggle(e: CustomEvent<any>) {
    const value = e.detail;
    appSettings.update((s) => Object({ ...s, rightPanelVisible: value }));
    splitpanes.update((s) =>
      Object({
        ...s,
        right: {
          ...s.right,
          size: $appSettings.rightPanelVisible ? s.right.default : 0,
        },
      }),
    );
  }
</script>

{#if import.meta.env.VITE_BUILD_TARGET !== "web"}
  <Titlebar />
{/if}

<AnimationToggle />
<Analytics />

<main
  use:watchResize={resize}
  on:mousewheel={(e) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }}
  id="app"
  spellcheck="false"
  class="dark relative flex w-full h-full flex-row justify-between overflow-hidden"
  style="font-size:{$appSettings.persistent.fontSize}px;"
>
  <!-- Switch between tabs for different application features. -->
  <NavTabs />

  <div class="flex flex-col w-full h-full">
    <FirmwareMismatchNotification />
    <LegacyCompletionNotification />
    {#if $appSettings.persistent.websocketNotificationEnabled}
      <WebSocketNotification />
    {/if}
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
          <div class="flex w-full h-full">
            <MiddlePanelContainer />
          </div>
        </Pane>

        <Pane
          bind:size={$splitpanes.right.size}
          minSize={$splitpanes.right.default}
          maxSize={65}
        >
          <RightPanelContainer />
        </Pane>
      </Splitpanes>
    </div>
  </div>
</main>

<style global>
  .activator-button {
    text-align: left;
    border: 1px solid rgba(0, 0, 0, 0);
    outline: 0px solid rgba(0, 0, 0, 0);
  }

  .activator-button:focus {
    border-color: var(--border) !important;
    outline-color: var(--border) !important;
  }

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
    background-color: transparent !important;
    border: none !important;
    position: relative;
    min-width: 0 !important;
    min-height: 0 !important;
  }
  .splitpanes.modern-theme .splitpanes__splitter:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    background-color: transparent !important;
    width: 4px;
    opacity: 0 !important;
    z-index: 1;
  }
  .splitpanes.modern-theme .splitpanes__splitter:hover:before {
    opacity: 0 !important;
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
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
</style>
