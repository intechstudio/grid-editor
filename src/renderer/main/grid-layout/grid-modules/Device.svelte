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

  import { logger } from "../../../runtime/runtime.store.js";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { selectedConfigStore } from "../../../runtime/config-helper.store";

  import { writeBuffer } from "../../../runtime/engine.store.js";
  import { runtime, user_input } from "../../../runtime/runtime.store.js";
  import { onMount } from "svelte";
  import ModuleSelection from "./underlays/ModuleBorder.svelte";
  import { Analytics } from "../../../runtime/analytics";
  import SystemElement from "./overlays/SystemElement.svelte";

  export let device = undefined;

  let moduleWidth = 2.1 * 106.6 + 2;
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
    const index = components.findIndex((e) => e.type === device.type);
    device.type = components[index].type;
    component = components[index].component;
  });

  function handleElementClicked(e) {
    const { elementNumber } = e.detail;
    if ($writeBuffer.length > 0) {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "engine-disabled",
        message: `Engine is disabled, selecting element has failed!`,
      });
      return;
    }

    selectElement(elementNumber);
  }

  function selectElement(controlNumber) {
    const elementType = device?.pages[0].control_elements.find(
      (e) => e.controlElementNumber == controlNumber
    ).controlElementType;
    user_input.update((ui) => {
      ui.brc.dx = +device?.dx;
      ui.brc.dy = +device?.dy;
      ui.event.elementnumber = +controlNumber;
      ui.event.elementtype = elementType;
      return ui;
    });
  }

  function handleModuleClicked(e) {
    if ($writeBuffer.length > 0) {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "engine-disabled",
        message: `Engine is disabled, changing event type failed!`,
      });
      return;
    }

    user_input.update((ui) => {
      ui.brc.dx = device?.dx;
      ui.brc.dy = device?.dy;
      ui.event.elementnumber = 255;
      ui.event.eventtype = 4;
      ui.event.elementtype = "system";
      return ui;
    });
  }

  $: {
    handleSelectedConfigChange($selectedConfigStore);
  }

  function handleSelectedConfigChange(store) {
    if (store.configType === "profile") {
      $appSettings.displayedOverlay = "profile-load-overlay";
    } else if (store.configType === "preset") {
      $appSettings.displayedOverlay = "preset-load-overlay";
    }
  }

  function handlePresetLoad(e) {
    const { elementNumber } = e.detail;
    if (typeof $selectedConfigStore === "undefined") {
      return;
    }

    Analytics.track({
      event: "Preset Load Start",
      payload: {},
      mandatory: false,
    });

    selectElement(elementNumber);
    runtime.element_preset_load($selectedConfigStore);
  }
</script>

<div class="pointer-events-none relative">
  <svelte:component
    this={component}
    {device}
    {moduleWidth}
    rotation={device?.rot}
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
        visible={$appSettings.displayedOverlay === undefined &&
          $appSettings.persistent.portstateOverlayEnabled}
      />
      <ModuleInfo {device} visible={true} />
      <ModuleSelection
        {device}
        visible={$appSettings.displayedOverlay === undefined}
        on:click={handleModuleClicked}
        class="absolute top-0 left-0 w-full h-full"
        style="border-radius: var(--grid-rounding);"
      />
    </svelte:fragment>

    <!-- Cell Underlays -->
    <svelte:fragment slot="cell-underlay" let:elementNumber>
      <div
        class="w-full h-full absolute"
        style="width: calc(100% - var(--element-margin) * 2); 
          height: calc(100% - var(--element-margin) * 2); 
          margin: var(--element-margin); "
      >
        <ActiveChanges
          {elementNumber}
          {device}
          visible={$appSettings.displayedOverlay === undefined}
          class="bg-unsavedchange bg-opacity-20 w-full h-full"
          style="border-radius: var(--grid-rounding);"
        />
        <ElementSelection
          {elementNumber}
          {device}
          visible={$appSettings.displayedOverlay === undefined}
          class="pointer-events-auto w-full h-full"
          style="border-radius: var(--grid-rounding);"
          on:click={handleElementClicked}
        />
      </div>
    </svelte:fragment>

    <!-- Cell Overlays -->
    <svelte:fragment slot="cell-overlay" let:elementNumber>
      <div
        class="w-full h-full absolute"
        style="width: calc(100% - var(--element-margin) * 2); 
          height: calc(100% - var(--element-margin) * 2); 
          margin: var(--element-margin); "
      >
        <PresetLoadOverlay
          {device}
          {elementNumber}
          visible={$appSettings.displayedOverlay === "preset-load-overlay"}
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
    <svelte:fragment slot="module-overlay" let:device>
      <SystemElement>
        <ActiveChanges
          elementNumber={255}
          {device}
          visible={$appSettings.displayedOverlay === undefined}
          class="bg-unsavedchange bg-opacity-20 w-full h-full rounded-t-full"
        />
        <ElementSelection
          elementNumber={255}
          {device}
          visible={$appSettings.displayedOverlay === undefined}
          class="pointer-events-auto w-full h-full rounded-t-full"
          on:click={handleElementClicked}
        />
      </SystemElement>

      <!-- Overlay Backdrop -->
      <div
        class="absolute w-full h-full pointer-events-none"
        class:bg-overlay={$appSettings.displayedOverlay !== undefined}
        style="border-radius: var(--grid-rounding);"
      />
      <ProfileLoadOverlay
        {device}
        visible={$appSettings.displayedOverlay === "profile-load-overlay"}
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

  .knob-and-led {
    display: flex;
    padding: 2px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: filter 0.2s;
    filter: drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.2));
  }

  .bg-overlay {
    background-color: rgba(30, 30, 30, 0.5);
    backdrop-filter: blur(1px);
  }
</style>
