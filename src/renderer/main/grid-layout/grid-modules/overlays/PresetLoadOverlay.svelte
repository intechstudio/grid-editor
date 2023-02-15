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

  export let id;
  export let selectedElement;
  export let moduleWidth;
  export let rotation;

  let showOverlay = false;
  let selectedPreset = undefined;
  let selectedControllerElement = selectedElement.event.elementtype;
  let overlayDesign;
  let controlElementSettings;
  let selectedIndex;

  /*   let isActionButtonClicked = false; */

  selectedPresetStore.subscribe((store) => {
    selectedPreset = store;
    showLoadPresetOverlay(selectedElement.event.elementtype, store.type);
  });

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

  $: console.log("selectedPreset", selectedPreset);

  /*   isActionButtonClickedStore.subscribe((store) => {
    isActionButtonClicked = store;
    showLoadProfileOverlay(id, store.type);
  });
 */

  function showLoadPresetOverlay(controller, presetType) {
    if (controller == presetType) {
      showOverlay = true;
    } else {
      showOverlay = false;
    }
  }

  $: if (id) {
    console.log(id);
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

  function selectModuleWhereProfileIsLoaded() {
    const dx = id.split(";")[0].split(":").pop();
    const dy = id.split(";")[1].split(":").pop();

    user_input.update((store) => {
      store.brc.dx = +dx;
      store.brc.dy = +dy;
      return store;
    });
  }

  function loadPreset() {
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
        let element =
          currentModule.pages[ui.event.pagenumber].control_elements[
            ui.event.elementnumber
          ].controlElementType;
        logger.set({
          type: "alert",
          mode: 0,
          classname: "presetload",
          message: `Preset is not made for ${element}!`,
        });
      }
    }
  }

  function cancelProfileOverlay() {
    selectedPresetStore.set({});

    window.electron.analytics.google("profile-library", {
      value: "cancel overlay",
    });

    window.electron.analytics.influx(
      "application",
      "profiles",
      "profile",
      "cancel overlay"
    );
  }

  function handleSelectElement(element) {
    user_input.update_elementnumber(element);
  }
</script>

<div
  class="overlay text-white w-full h-full justify-items-center items-end gap-1 {overlayDesign ==
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
            handleSelectElement(element.controlElementNumber), loadPreset();
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
