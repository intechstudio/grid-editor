<script>
  /*
   *   tailwindcss
   */

  import "./app.css";

  /**
   *  svelte UI parts and components
   */

  import { Pane, Splitpanes } from "svelte-splitpanes";

  import { onMount } from "svelte";
  import { get } from "svelte/store";

  import { appSettings, splitpanes } from "./runtime/app-helper.store";

  import "./runtime/analytics";

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

  import TooltipGetter from "./main/user-interface/tooltip/TooltipGetter.svelte";

  import Monster from "./main/user-interface/Monster.svelte";
  import { attachment } from "./main/user-interface/Monster.store";

  import Updater from "./shared/updater/Updater.svelte";

  import { windowSize } from "./runtime/window-size";

  import { authStore } from "$lib/auth.store";
  import { profileLinkStore } from "$lib/profilelink.store";

  import { watchResize } from "svelte-watch-resize";
  import { debug_lowlevel_store } from "./main/panels/WebsocketMonitor/WebsocketMonitor.store";
  import UserLogin from "./main/modals/UserLogin.svelte";

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

  let testy = "test";

  onMount(() => {
    // application mounted, check analytics
    window.electron.analytics.google("fw-editor-version", {
      value: `v${get(appSettings).version.major}.${
        get(appSettings).version.minor
      }.${get(appSettings).version.patch}`,
    });
  });
</script>

<Monster
  {name}
  shapeSelected={$appSettings.persistant.helperShape}
  colorSelected={$appSettings.persistant.helperColor}
  {attachment}
/>

<Titlebar />

<main
  use:watchResize={resize}
  id="app"
  spellcheck="false"
  class="relative flex w-full h-full flex-row justify-between overflow-hidden"
>
  <!-- Switch between tabs for different application features. -->
  <NavTabs />

  <svelte:component this={modalComponents[$appSettings.modal]} />

  <!-- Update notification -->
  <Updater />

  <TooltipGetter />

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

        <Pane>
          <GridLayout classes={"flex-1"} />
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
