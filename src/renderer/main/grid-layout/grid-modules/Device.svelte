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

  import { writeBuffer } from "../../../runtime/engine.store.js";
  import {
    runtime,
    user_input,
    unsaved_changes,
  } from "../../../runtime/runtime.store.js";
  import { onMount } from "svelte";
  import ModuleSelection from "./underlays/ModuleSelection.svelte";

  export let id;
  export let margin = 0;

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
      ui.event.elementnumber = 255;
      ui.event.eventtype = 4;
      ui.event.elementtype = "system";
      return ui;
    });
  }

  let isChanged = false;
  $: {
    isChanged =
      typeof $unsaved_changes.find(
        (e) => e.x == device?.dx && e.y == device?.dy && e.element == 255
      ) !== "undefined";
  }

  let isSelected = false;
  $: {
    isSelected =
      device?.dx == $user_input.brc.dx && device?.dy == $user_input.brc.dy;
  }
</script>

<div
  class="pointer-events-none border-2 border-transparent relative border-opacity-10 bg-primary"
  class:border-unsavedchange={isChanged && !moduleHovered}
  class:border-opacity-10={isChanged && !isSelected}
  class:border-white={moduleHovered}
  class:border-opacity-50={moduleHovered}
  class:animate-border-error={device?.fwMismatch}
  style="border-radius: 6px;"
>
  <svelte:component
    this={component}
    {device}
    {moduleWidth}
    let:elementNumber
    let:device
  >
    <!-- Module Underlays -->
    <svelte:fragment slot="module-underlay" let:device>
      <ModuleSelection
        bind:moduleHovered
        {margin}
        on:click={handleModuleClicked}
      />
      <ActiveChanges
        elementNumber={255}
        {device}
        style="bg-unsavedchange bg-opacity-10"
        margin={0}
      />
      <PortState {device} />
      <ModuleInfo {device} />
    </svelte:fragment>

    <!-- Cell Underlays -->
    <svelte:fragment slot="cell-underlay" let:elementNumber>
      <ActiveChanges {elementNumber} {device} />
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
      <ControlNameOverlay {id} {moduleWidth} bankActive={0} />
      <ProfileLoadOverlay {id} {device} />
      <PresetLoadOverlay {id} bankActive={0} {moduleWidth} {device} />
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

  .animate-border-error {
    animation-name: error-animation;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: alternate-reverse;
    animation-timing-function: ease;
  }

  @keyframes error-animation {
    from {
      border-color: transparent;
    }
    to {
      border-color: #dc2626;
    }
  }
</style>
