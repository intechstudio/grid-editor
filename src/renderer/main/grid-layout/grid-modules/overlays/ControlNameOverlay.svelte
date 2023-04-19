<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";
  import { selectedProfileStore } from "../../../../runtime/profile-helper.store";
  import {
    runtime,
    elementNameStore,
    user_input,
  } from "../../../../runtime/runtime.store.js";

  export let id;
  export let moduleWidth;
  export let rotation;
  export let bankActive;

  let elementNames = [];

  let dx, dy;

  let overlayDesign;

  let showOverlay = true;

  $: breakpoint = moduleWidth > 200 ? "large" : "small";

  let controlElementSettings;

  let selectedProfile = {};

  selectedProfileStore.subscribe((store) => {
    selectedProfile = store;
    showControlNameOverlay(selectedProfile);
    showOverlay;
  });

  function showControlNameOverlay(selectedProfile) {
    if (Object.keys(selectedProfile).length == 0) {
      showOverlay = true;
    } else {
      showOverlay = false;
      $appSettings.overlays.controlElementName = false;
    }
  }

  const control_block = (number) => {
    let array = [];
    for (let i = 0; i < number; i++) {
      array.push(i);
    }
    return array;
  };

  runtime.subscribe((runtime) => {
    const device = runtime.find((controller) => controller.id == id);
    if (device !== undefined) {
      controlElementSettings = device.pages[0].control_elements;
    }
  });

  $: if (id) {
    if (id.startsWith("PBF4")) {
      overlayDesign = "3x4";
    } else if (id.startsWith("EF44")) {
      overlayDesign = "2x4";
    } else {
      overlayDesign = "4x4";
    }

    if (id !== undefined && id.length > 4) {
      dx = +id.split(";")[0].split(":").pop();
      dy = +id.split(";")[1].split(":").pop();
    }
  }

  $: {
    try {
      const obj = $elementNameStore[dx][dy];

      Object.keys(obj).forEach((key) => {
        controlElementSettings[key].controlElementName = obj[key];
      });
    } catch (error) {}
  }
</script>

{#if showOverlay == true}
  {#if overlayDesign == "4x4"}
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
  {/if}
{/if}

<style>
  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    background-color: rgba(30, 30, 30, 0.8);
    border-radius: 0.5rem;
    justify-content: space-around;
    backdrop-filter: blur(1px);
    z-index: 50;
  }
</style>
