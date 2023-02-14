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

  $: console.log("selectedIndex", selectedIndex);

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

  runtime.subscribe((runtime) => {
    const device = runtime.find((controller) => controller.id == id);
    if (device !== undefined) {
      controlElementSettings = device.pages[0].control_elements;
    }
  });

  function loadProfileToThisModule() {
    selectModuleWhereProfileIsLoaded();

    window.electron.analytics.google("profile-library", {
      value: "load start",
    });
    window.electron.analytics.influx(
      "application",
      "profiles",
      "profile",
      "load start"
    );

    // to do.. if undefined configs

    runtime.whole_page_overwrite(selectedPreset.configs);

    window.electron.analytics.google("profile-library", {
      value: "load success",
    });
    window.electron.analytics.influx(
      "application",
      "profiles",
      "profile",
      "load success"
    );
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

  function pop() {
    selectedIndex.options.pop();
    selectedIndex = selectedIndex;
  }

  pop();
</script>

{#if showOverlay == true}
  {#if id.startsWith("PBF4")}
    <div class="overlay text-white w-full h-full grid grid-cols-4 grid-rows-3">
      {#each selectedIndex.options as element}
        <div>
          <button class="bg-violet-600 py-1 px-2 rounded-md">{element} </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if id.startsWith("PO16") || id.startsWith("EN16") || id.startsWith("EN16")}
    <div class="overlay text-white w-full">
      {#each control_block(4) as block}
        <div
          class="text-xs flex flex-col justify-around "
          style="width: {moduleWidth / 4 + 'px'}"
        >
          {#each control_block(4) as element}
            <div
              class="text-xs flex flex-col items-center "
              style="height: {moduleWidth / 4 + 'px'}; transform: rotate({1 *
                rotation *
                90 +
                'deg'})"
            >
              {#if breakpoint == "small" || controlElementSettings[element * 4 + block].controlElementName.length <= 4}
                <div class="block font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}

                  <button class="bg-violet-600 py-1 px-2 rounded-md"
                    >{element}
                  </button>
                </div>
                <!--               {:else if breakpoint == "large" && controlElementSettings[element * 4 + block].controlElementName.length > 4}
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}
                </div>
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(4, 4)}
                </div> -->
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  {#if id.startsWith("EF44")}
    <div class="overlay text-white w-full">
      {#each control_block(4) as block}
        <div
          class="text-xs flex flex-col justify-around "
          style="width: {moduleWidth / 4 + 'px'}"
        >
          {#each control_block(1) as element}
            <div
              class="text-xs flex flex-col items-center "
              style="height: {moduleWidth / 4 + 'px'}; transform: rotate({1 *
                rotation *
                90 +
                'deg'})"
            >
              {#if breakpoint == "small" || controlElementSettings[element * 4 + block].controlElementName.length <= 4}
                <div class="block font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}

                  <button class="bg-violet-600 py-1 px-2 rounded-md"
                    >{element}
                  </button>
                </div>
                <!--               {:else if breakpoint == "large" && controlElementSettings[element * 4 + block].controlElementName.length > 4}
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}
                </div>
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(4, 4)}
                </div> -->
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
  <!--   {#if overlayDesign == "4x4"}
    <div class="overlay text-white w-full">
      {#each control_block(4) as block}
        <div
          class="text-xs flex flex-col justify-around items-center"
          style="width: {moduleWidth / 4 + 'px'}"
        >
          {#each control_block(4) as element}
            <div
              class="text-xs flex flex-col items-center justify-center"
              style="height: {moduleWidth / 4 + 'px'}; transform: rotate({1 *
                rotation *
                90 +
                'deg'})"
            >
              {#if breakpoint == "small" || controlElementSettings[element * 4 + block].controlElementName.length <= 4}
                <div class="block font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}
                  {element}
                </div>
              {:else if breakpoint == "large" && controlElementSettings[element * 4 + block].controlElementName.length > 4}
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}
                </div>
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(4, 4)}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else if overlayDesign == "3x4"}
  
    <div class="overlay text-white w-full">
      {#each control_block(4) as block}
        <div
          class="text-xs flex flex-col justify-around items-center"
          style="width: {moduleWidth / 4 + 'px'}"
        >
          {#each control_block(3) as element}
            <div
              class="text-xs flex flex-col items-center justify-center"
              style="height: {moduleWidth / 4 + 'px'}; transform: rotate({1 *
                rotation *
                90 +
                'deg'})"
            >
              {#if breakpoint == "small" || controlElementSettings[element * 4 + block].controlElementName.length <= 4}
                <div class="block font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}

                  <button class="bg-violet-600 py-1 px-2 rounded-md"
                    >{element}</button
                  >
                </div>
              {:else if breakpoint == "large" && controlElementSettings[element * 4 + block].controlElementName.length > 4}
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}
                </div>
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(4, 4)}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else if overlayDesign == "2x4"}
    <div class="overlay text-white w-full">
      {#each control_block(4) as block}
        <div
          class="text-xs flex flex-col justify-around items-center"
          style="width: {moduleWidth / 4 + 'px'}"
        >
          {#each control_block(2) as element}
            <div
              class="text-xs flex flex-col items-center justify-center"
              style="height: {((element * 2 + 1) * moduleWidth) / 4 + 'px'};
            transform: rotate({1 * rotation * 90 + 'deg'})"
            >
              {#if breakpoint == "small" || controlElementSettings[element * 4 + block].controlElementName.length <= 4}
                <div class="block font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}
                </div>
              {:else if breakpoint == "large" && controlElementSettings[element * 4 + block].controlElementName.length > 4}
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(0, 4)}
                </div>
                <div class="block p-0 m-0 font-mono">
                  {controlElementSettings[
                    element * 4 + block
                  ].controlElementName.substr(4, 4)}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if} -->
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
