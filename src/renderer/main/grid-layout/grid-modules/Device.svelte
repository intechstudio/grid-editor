<script>
  import { onMount } from "svelte";

  import BU16 from "./devices/BU16.svelte";
  import PO16 from "./devices/PO16.svelte";
  import PBF4 from "./devices/PBF4.svelte";
  import EN16 from "./devices/EN16.svelte";
  import EF44 from "./devices/EF44.svelte";

  import ControlNameOverlay from "./overlays/ControlNameOverlay.svelte";
  import ProfileLoadOverlay from "./overlays/ProfileLoadOverlay.svelte";
  import PresetLoadOverlay from "./overlays/PresetLoadOverlay.svelte";

  import { appSettings } from "../../../runtime/app-helper.store.js";
  import { user_input } from "../../../runtime/runtime.store.js";
  import { selectedProfileStore } from "../../../runtime/profile-helper.store";
  import { selectedPresetStore } from "../../../runtime/preset-helper.store";
  import { isActionButtonClickedStore } from "/runtime/profile-helper.store";
  import { get } from "svelte/store";

  const components = [
    { type: "BU16", component: BU16 },
    { type: "PO16", component: PO16 },
    { type: "PBF4", component: PBF4 },
    { type: "EN16", component: EN16 },
    { type: "EF44", component: EF44 },
  ];

  export let type;
  export let id;
  export let rotation;

  export let selected;

  export let arch;

  console.log("arch", arch);

  let selectedElement;

  let isActionButtonClicked;

  $: moduleWidth = $appSettings.size * 106.6 + 2;

  $: selected = components.find((component) => component.type === type);

  $: {
    isActionButtonClicked = $isActionButtonClickedStore;
  }

  $: {
    if (!isActionButtonClicked) {
      if (
        Object.keys($selectedProfileStore).length !== 0 ||
        Object.keys($selectedPresetStore).length !== 0
      ) {
        selectedElement = { id: "", brc: {}, event: {} };
      } else {
        selectedElement = $user_input;
      }
    }
  }
</script>

{#if selected}
  <svelte:component
    this={selected.component}
    {moduleWidth}
    {id}
    {rotation}
    {selectedElement}
  >
    {#if $appSettings.overlays.controlElementName}
      <ControlNameOverlay {id} {moduleWidth} bankActive={0} {rotation} />
    {/if}

    <div
      class="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5 opacity-10 text-white font-bold text-xs"
    >
      {#if arch === "esp32"}
        E-32
      {:else}
        D-51
      {/if}
    </div>

    <ProfileLoadOverlay {id} />
    <PresetLoadOverlay {id} {rotation} bankActive={0} {moduleWidth} />
  </svelte:component>
{/if}

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
    filter: drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.5));
  }

  .knob-and-led:hover {
    filter: drop-shadow(0px 0px 13px rgba(255, 255, 255, 0.15));
    cursor: pointer;
  }

  .knob-and-led:not(.active-element):hover {
    background-color: rgba(136, 136, 136, 0.1);
    box-shadow: inset 0 0 0px #ffffff33;
    padding: 0.2rem;
    border-radius: 0.5rem;
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

  .active-element {
    background-color: rgba(136, 136, 136, 0.35);
    box-shadow: inset 0 0 0px #ffffff33;
    padding: 0.2rem;
    border-radius: 0.5rem;
  }

  .active-systemelement {
    background-color: #212a2b;
    box-shadow: inset 0 0 10px #dddddd60;
  }
</style>
