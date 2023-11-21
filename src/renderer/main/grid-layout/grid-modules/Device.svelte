<script>
  import BU16 from "./devices/BU16.svelte";
  import PO16 from "./devices/PO16.svelte";
  import PBF4 from "./devices/PBF4.svelte";
  import EN16 from "./devices/EN16.svelte";
  import EF44 from "./devices/EF44.svelte";
  import TEK2 from "./devices/TEK2.svelte";

  import { selectElement } from "./event-handlers/select.js";

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
  import ModuleSelection from "./underlays/ModuleSelection.svelte";

  export let id;
  export let margin = 0;
  export let rounding = 6;

  let moduleWidth = 2.1 * 106.6 + 2;

  let component = undefined;
  let device = undefined;

  onMount(() => {
    const components = [
      { type: "BU16", component: BU16 },
      { type: "PO16", component: PO16 },
      { type: "PBF4", component: PBF4 },
      { type: "EN16", component: EN16 },
      { type: "EF44", component: EF44 },
      { type: "TEK2", component: TEK2 },
    ];
    device = $runtime.find((e) => e.id === id);
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

    selectElement(elementNumber, device.type, device.id);
  }

  let moduleHovered = false;

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
      if (
        device?.type === $selectedConfigStore.type &&
        $appSettings.leftPanel === "ProfileCloud"
      ) {
        $appSettings.displayedOverlay = "profile-load-overlay";
      } else if ($appSettings.displayedOverlay === "profile-load-overlay") {
        $appSettings.displayedOverlay = undefined;
      }
    } else if (store.configType === "preset") {
      const compatible = device?.pages[0].control_elements
        .map((e) => e.controlElementType)
        .includes($selectedConfigStore.type);

      if (
        compatible &&
        $writeBuffer.length == 0 &&
        $appSettings.leftPanel === "ProfileCloud"
      ) {
        $appSettings.displayedOverlay = "preset-load-overlay";
      } else if ($appSettings.displayedOverlay === "preset-load-overlay") {
        $appSettings.displayedOverlay = undefined;
      }
    }
  }
</script>

<div class="pointer-events-none relative">
  <svelte:component
    this={component}
    {device}
    {moduleWidth}
    let:elementNumber
    let:device
  >
    <!-- Module Underlays -->
    <svelte:fragment slot="module-underlay" let:device>
      <!-- Default Backdrop -->
      <div
        class="bg-primary w-full h-full"
        style="border-radius: {rounding}px;"
      />
      <ActiveChanges
        elementNumber={255}
        {device}
        class="bg-unsavedchange bg-opacity-10 border-2 border-unsavedchange"
        style="border-radius: {rounding}px;"
        margin={0}
      />
      <ModuleSelection
        bind:moduleHovered
        {margin}
        {rounding}
        {device}
        on:click={handleModuleClicked}
      />
      <PortState {device} />
      <ModuleInfo {device} />
    </svelte:fragment>

    <!-- Cell Underlays -->
    <svelte:fragment slot="cell-underlay" let:elementNumber>
      <ActiveChanges
        {elementNumber}
        {device}
        class="bg-unsavedchange border bg-opacity-10 rounded-lg border-unsavedchange"
        style="border-radius: {rounding}px;"
      />
      <ElementSelection
        {elementNumber}
        {device}
        on:click={handleElementClicked}
      />
    </svelte:fragment>

    <!-- Cell Overlays -->
    <svelte:fragment slot="cell-overlay" let:elementNumber />

    <!-- Module Overlays -->
    <svelte:fragment slot="module-overlay" let:device>
      <ControlNameOverlay
        {id}
        {moduleWidth}
        bankActive={0}
        visible={$appSettings.displayedOverlay === "control-name-overlay"}
      />
      <ProfileLoadOverlay
        {id}
        {device}
        visible={$appSettings.displayedOverlay === "profile-load-overlay"}
      />
      <PresetLoadOverlay
        {id}
        bankActive={0}
        {moduleWidth}
        {device}
        visible={$appSettings.displayedOverlay === "preset-load-overlay"}
      />
    </svelte:fragment>
  </svelte:component>
</div>

<style global>
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
    filter: drop-shadow(2px 4px 7px rgba(20, 20, 20, 0.4));
  }
</style>
