<script>
  import { selectedPresetStore } from "../../../../runtime/preset-helper.store";
  import {
    elementNameStore,
    runtime,
    user_input,
  } from "../../../../runtime/runtime.store";
  import { isActionButtonClickedStore } from "/runtime/profile-helper.store";
  import { appSettings } from "/runtime/app-helper.store";
  import { get } from "svelte/store";
  import { selectedControllerIndexStore } from "/runtime/preset-helper.store";
  import AddAction from "../../../panels/configuration/components/AddAction.svelte";
  import Bin from "../../../panels/configuration/components/Bin.svelte";

  export let id;
  export let moduleWidth;
  export let rotation;

  let showOverlay = false;
  let selectedPreset;

  let overlayDesign;
  let controlElementSettings;
  let selectedIndex;

  $: console.log(selectedPreset, "selectedPreset");

  selectedControllerIndexStore.subscribe((store) => {
    selectedIndex = store;
  });

  let device;
  runtime.subscribe((runtime) => {
    device = runtime.find((controller) => controller.id == id);
    if (device !== undefined) {
      controlElementSettings = device.pages[0].control_elements;
    }
  });

  let isModuleCompatibleWithPreset = [];

  function showLoadPresetOverlay() {
    isModuleCompatibleWithPreset = [];

    device.pages[0].control_elements.slice(0, -1).forEach((element) => {
      if (element.controlElementType == selectedPreset.type) {
        isModuleCompatibleWithPreset = [...isModuleCompatibleWithPreset, true];
      } else if (element.controlElementType != selectedPreset.type) {
        isModuleCompatibleWithPreset = [...isModuleCompatibleWithPreset, false];
      }
    });

    if (isModuleCompatibleWithPreset.includes(true)) {
      showOverlay = true;
    } else {
      showOverlay = false;
    }
  }

  selectedPresetStore.subscribe((store) => {
    selectedPreset = store;
    showLoadPresetOverlay();
    console.log(selectedPreset);
  });

  $: if (id) {
    if (id.startsWith("PBF4")) {
      overlayDesign = "3x4";
    } else if (id.startsWith("EF44")) {
      overlayDesign = "2x4";
    } else {
      overlayDesign = "4x4";
    }
  }

  $: breakpoint = moduleWidth > 200 ? "large" : "small";

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  };

  function selectModuleWhereProfileIsLoaded(element) {
    const dx = id.split(";")[0].split(":").pop();
    const dy = id.split(";")[1].split(":").pop();

    user_input.update((store) => {
      store.brc.dx = +dx;
      store.brc.dy = +dy;
      store.event.elementtype = element.controlElementType;
      store.event.elementnumber = element.controlElementNumber;
      return store;
    });
  }

  function loadPreset(element) {
    selectModuleWhereProfileIsLoaded(element);

    window.electron.analytics.google("preset-library", { value: "load start" });
    window.electron.analytics.influx(
      "application",
      "presets",
      "preset",
      "load start"
    );

    if (selectedPreset !== undefined) {
      const preset = selectedPreset;

      const rt = get(runtime);
      const ui = get(user_input);
      const currentModule = rt.find(
        (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
      );

      if (ui.event.elementtype == preset.type) {
        runtime.element_preset_load(preset);

        window.electron.analytics.google("preset-library", {
          value: "load success",
        });
        window.electron.analytics.influx(
          "application",
          "presets",
          "preset",
          "load success"
        );
      } else {
        window.electron.analytics.google("preset-library", {
          value: "load mismatch",
        });
        window.electron.analytics.influx(
          "application",
          "presets",
          "preset",
          "load mismatch"
        );
        /*         let element =
          currentModule.pages[ui.event.pagenumber].control_elements[
            ui.event.elementnumber
          ].controlElementType; */
      }
    }
  }
</script>

{#if showOverlay}
  <div
    class=" overlay text-white w-full h-full justify-items-center items-end gap-1 {overlayDesign ==
    '3x4'
      ? 'grid-cols-4 grid-rows-3'
      : overlayDesign == '2x4'
      ? 'grid-cols-4 grid-rows-2'
      : overlayDesign == '4x4'
      ? 'grid-cols-4 grid-rows-4'
      : ''} grid "
  >
    {#each controlElementSettings.slice(0, -1) as element}
      <div>
        {#if element.controlElementType == selectedPreset.type}
          <button
            on:click={() => {
              loadPreset(element);
            }}
            class=" bg-commit block 
    w-full text-white mt-3  py-1 px-1 rounded border-commit-saturate-10
    hover:border-commit-desaturate-10 focus:outline-none"
            >load
          </button>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(30, 30, 30, 0.5);
    border-radius: 0.5rem;
    justify-content: space-around;
    backdrop-filter: blur(0.5px);
    z-index: 50;
  }
</style>
