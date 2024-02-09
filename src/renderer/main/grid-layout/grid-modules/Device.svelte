<script>
  import BU16 from "./devices/BU16.svelte";
  import PO16 from "./devices/PO16.svelte";
  import PBF4 from "./devices/PBF4.svelte";
  import EN16 from "./devices/EN16.svelte";
  import EF44 from "./devices/EF44.svelte";
  import TEK2 from "./devices/TEK2.svelte";

  //Overlays
  import ControlNameOverlay from "./overlays/ControlNameOverlay.svelte";
  import ProfileLoadOverlay from "./overlays/ProfileLoadOverlay.svelte";
  import PresetLoadOverlay from "./overlays/PresetLoadOverlay.svelte";

  //Underlays
  import PortState from "./underlays/PortState.svelte";
  import ModuleInfo from "./underlays/ModuleInfo.svelte";
  import ActiveChanges from "./underlays/ActiveChanges.svelte";
  import ElementSelection from "./underlays/ElementSelection.svelte";

  import { appSettings } from "../../../runtime/app-helper.store";
  import { selectedConfigStore } from "../../../runtime/config-helper.store";
  import { user_input } from "../../../runtime/runtime.store.js";
  import { onMount } from "svelte";
  import ModuleSelection from "./underlays/ModuleBorder.svelte";
  import { Analytics } from "../../../runtime/analytics";
  import {
    configManager,
    ConfigTarget,
  } from "../../panels/configuration/Configuration.store";

  export let device = undefined;
  export let width = 225;

  let component = undefined;

  onMount(() => {
    const components = [
      { type: "BU16", component: BU16 },
      { type: "PO16", component: PO16 },
      { type: "PBF4", component: PBF4 },
      { type: "EN16", component: EN16 },
      { type: "EF44", component: EF44 },
      { type: "TEK2", component: TEK2 },
    ];
    const index = components.findIndex((e) => e.type === device?.type);
    device.type = components[index].type;
    component = components[index].component;
  });

  function handleElementClicked(e) {
    const { elementNumber } = e.detail;
    selectElement(elementNumber);
  }

  function selectElement(controlNumber) {
    user_input.set({
      dx: device?.dx,
      dy: device?.dy,
      pagenumber: $user_input.pagenumber,
      elementnumber: controlNumber,
      eventtype: $user_input.eventtype,
    });
  }

  function handlePresetLoad(e) {
    const { sender, elementNumber } = e.detail;

    Analytics.track({
      event: "Preset Load Start",
      payload: {},
      mandatory: false,
    });

    configManager
      .loadPreset({
        x: device.dx,
        y: device.dy,
        element: elementNumber,
        preset: $selectedConfigStore,
      })
      .then(() => {
        sender.dispatchEvent(
          new CustomEvent("preset-load", {
            detail: {
              success: true,
            },
          })
        );

        Analytics.track({
          event: "Preset Load Success",
          payload: {},
          mandatory: false,
        });
      })
      .catch((e) => {
        console.error(e);
        //TODO: make feedback for fail
      });
  }

  function handleProfileLoad(e) {
    const { sender, device } = e.detail;

    Analytics.track({
      event: "Profile Load Start",
      payload: {},
      mandatory: false,
    });

    configManager
      .loadProfile({
        x: device.dx,
        y: device.dy,
        profile: $selectedConfigStore.configs,
      })
      .then(() => {
        sender.dispatchEvent(
          new CustomEvent("profile-load", {
            detail: {
              success: true,
            },
          })
        );

        Analytics.track({
          event: "Profile Load Success",
          payload: {},
          mandatory: false,
        });
      })
      .catch((e) => {
        console.error(e);
        //TODO: make feedback for fail
      });
  }
</script>

<div class="pointer-events-none {$$props.classs}" style={$$props.style}>
  <svelte:component
    this={component}
    {device}
    moduleWidth={width}
    let:elementNumber
    let:device
  >
    <!-- Module Underlays -->
    <svelte:fragment slot="module-underlay" let:device>
      <!-- Default Backdrop -->
      <div
        class="absolute bg-primary w-full h-full"
        style="border-radius: var(--grid-rounding);"
      />
      <PortState
        {device}
        visible={$appSettings.persistent.portstateOverlayEnabled}
      />
      <ModuleSelection
        {device}
        visible={true}
        class="absolute top-0 left-0 w-full h-full"
        style="border-radius: var(--grid-rounding);"
      />
    </svelte:fragment>

    <!-- Cell Underlays -->
    <svelte:fragment
      slot="cell-underlay"
      let:elementNumber
      let:isLeftCut
      let:isRightCut
    >
      <div
        class="w-full h-full absolute"
        style="width: calc(100% - var(--element-margin) * 2); 
          height: calc(100% - var(--element-margin) * 2); 
          margin: var(--element-margin); "
      >
        <ActiveChanges
          {elementNumber}
          {isLeftCut}
          {isRightCut}
          {device}
          visible={typeof $appSettings.displayedOverlay === "undefined" ||
            $appSettings.displayedOverlay === "configuration-load-overlay"}
        />
        <ElementSelection
          {elementNumber}
          {isLeftCut}
          {isRightCut}
          {device}
          visible={typeof $appSettings.displayedOverlay === "undefined"}
          on:click={handleElementClicked}
        />
      </div>
      <ModuleInfo {device} visible={true} {elementNumber} />
    </svelte:fragment>

    <!-- Cell Overlays -->
    <svelte:fragment
      slot="cell-overlay"
      let:elementNumber
      let:isLeftCut
      let:isRightCut
    >
      <div
        class="absolute"
        style="width: calc(100% - var(--element-margin) * 2); 
          height: calc(100% - var(--element-margin) * 2); 
          margin: var(--element-margin);"
      >
        <PresetLoadOverlay
          {device}
          {elementNumber}
          {isLeftCut}
          {isRightCut}
          visible={$appSettings.displayedOverlay ===
            "configuration-load-overlay" &&
            $selectedConfigStore?.configType === "preset"}
          class="pointer-events-auto w-full h-full"
          style="border-radius: var(--grid-rounding);"
          on:click={handlePresetLoad}
        />
      </div>
      <ControlNameOverlay
        {device}
        {elementNumber}
        visible={$appSettings.displayedOverlay === "control-name-overlay"}
      />
    </svelte:fragment>

    <!-- Module Overlays -->
    <svelte:fragment slot="module-overlay">
      <ProfileLoadOverlay
        {device}
        visible={$appSettings.displayedOverlay ===
          "configuration-load-overlay" &&
          $selectedConfigStore?.configType === "profile"}
        on:click={handleProfileLoad}
      />
    </svelte:fragment>
  </svelte:component>
</div>

<style global>
  :root {
    --element-margin: 5px;
    --grid-rounding: 5px;
  }
  .module-dimensions {
    width: var(--module-size);
    height: var(--module-size);
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    border-radius: 6px;
  }

  .bg-overlay {
    background-color: rgba(30, 30, 30, 0.5);
  }

  .normal-cell-underlay-container {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .normal-cell-ui-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
    display: flex;
    padding: 2px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: filter 0.2s;
    filter: drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.2));
  }
  .normal-cell-overlay-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 3;
  }
  .system-cell-underlay-container {
    pointer-events: none;
    position: absolute;
    z-index: 1;
  }
  .system-cell-overlay-container {
    pointer-events: none;
    position: absolute;
    z-index: 3;
  }

  .module-underlay-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .module-overlay-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 4;
  }
</style>
