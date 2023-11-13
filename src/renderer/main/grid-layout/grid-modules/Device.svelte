<script>
  import BU16 from "./devices/BU16.svelte";
  import PO16 from "./devices/PO16.svelte";
  import PBF4 from "./devices/PBF4.svelte";
  import EN16 from "./devices/EN16.svelte";
  import EF44 from "./devices/EF44.svelte";
  import TEK2 from "./devices/TEK2.svelte";

  import { selectElement } from "./event-handlers/select.js";

  import ControlNameOverlay from "./overlays/ControlNameOverlay.svelte";
  import ProfileLoadOverlay from "./overlays/ProfileLoadOverlay.svelte";
  import PresetLoadOverlay from "./overlays/PresetLoadOverlay.svelte";

  import { appSettings } from "../../../runtime/app-helper.store.js";
  import { user_input, logger } from "../../../runtime/runtime.store.js";
  import { selectedConfigStore } from "/runtime/config-helper.store";
  import { isActionButtonClickedStore } from "/runtime/config-helper.store";
  import { get } from "svelte/store";
  import { writeBuffer } from "../../../runtime/engine.store.js";
  import { runtime } from "../../../runtime/runtime.store.js";
  import { onMount } from "svelte";

  export let id;

  let selectedElement;

  let isActionButtonClicked;

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

  $: {
    isActionButtonClicked = $isActionButtonClickedStore;
  }

  $: {
    if (!isActionButtonClicked) {
      if (Object.keys($selectedConfigStore).length !== 0) {
        selectedElement = { id: "", brc: {}, event: {} };
      } else {
        selectedElement = $user_input;
      }
    }
  }

  let showProfileLoadOverlay = false;
  $: {
    showProfileLoadOverlay =
      device?.type === $selectedConfigStore.type &&
      $selectedConfigStore.configType === "profile";
  }

  let showPresetLoadOverlay = false;
  $: {
    let device = get(runtime).find((controller) => controller.id == id);

    if (
      typeof device !== "undefined" &&
      $selectedConfigStore.configType === "preset"
    ) {
      const compatible = device.pages[0].control_elements
        .map((e) => e.controlElementType)
        .includes($selectedConfigStore.type);

      showPresetLoadOverlay = compatible;
    } else {
      showPresetLoadOverlay = false;
    }
  }

  function handleModuleClicked(e) {
    const { elementNumber, type, id } = e.detail;
    if ($writeBuffer.length > 0) {
      logger.set({
        type: "fail",
        mode: 0,
        classname: "engine-disabled",
        message: `Engine is disabled, selecting element has failed!`,
      });
      return;
    }

    selectElement(elementNumber, type, id);
  }
</script>

<div>
  {#if $appSettings.overlays.controlElementName}
    <ControlNameOverlay
      {id}
      {moduleWidth}
      bankActive={0}
      rotation={device?.rotation}
    />
  {/if}

  <div
    class="absolute text-center bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5 opacity-10 text-white font-bold text-xs"
  >
    {#if device?.arch === "esp32"}
      E-32<br />
      {"v" +
        device?.fwVersion.major +
        "." +
        device?.fwVersion.minor +
        "." +
        device?.fwVersion.patch}
    {:else}
      D-51<br />
      {"v" +
        device?.fwVersion.major +
        "." +
        device?.fwVersion.minor +
        "." +
        device?.fwVersion.patch}
    {/if}
  </div>

  {#if $appSettings.persistent.portstateOverlayEnabled}
    {#if (device.portstate & 1) !== 0}
      <div
        class="absolute top-0 left-1/2 transform -translate-x-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
      />
    {/if}

    {#if (device.portstate & 2) !== 0}
      <div
        class="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
      />
    {/if}

    {#if (device.portstate & 4) !== 0}
      <div
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
      />
    {/if}

    {#if (device.portstate & 8) !== 0}
      <div
        class="absolute left-0 top-1/2 transform -translate-y-1/2 opacity-50 text-white font-bold text-xl bg-green-500 w-20 h-20"
      />
    {/if}
  {/if}

  <svelte:component this={component} {moduleWidth} />

  {#if $writeBuffer.length == 0}
    {#if showProfileLoadOverlay && $appSettings.leftPanel === "ProfileCloud"}
      <ProfileLoadOverlay {id} rotation={device.rotation} />
    {/if}
    {#if showPresetLoadOverlay && $appSettings.leftPanel === "ProfileCloud"}
      <PresetLoadOverlay
        {id}
        rotation={device.rotation}
        bankActive={0}
        {moduleWidth}
      />
    {/if}
  {/if}
</div>

<style global>
  .module-dimensions {
    width: var(--module-size);
    height: var(--module-size);
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    background-color: #1e2628;
    border-radius: 0.5rem;
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

  .control-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    display: flex;
    justify-content: space-around;
    margin-top: var(--control-row-mt);
    margin-left: var(--control-row-mx);
    margin-right: var(--control-row-mx);
  }

  .control-row:last-child {
    margin-bottom: var(--control-row-mb);
  }

  .disable-pointer-events {
    pointer-events: none;
  }

  .active-systemelement {
    background-color: #212a2b;
    box-shadow: inset 0 0 10px #dddddd60;
  }
</style>
