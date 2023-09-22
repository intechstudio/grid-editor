<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";
  import { selectedProfileStore } from "../../../../runtime/profile-helper.store";
  import ControlNameComponent from "./ControlNameComponent.svelte";
  import {
    runtime,
    elementNameStore,
    user_input,
  } from "../../../../runtime/runtime.store.js";

  export let id;
  export let moduleWidth;
  export let rotation;

  let showOverlay = true;

  $: breakpoint = moduleWidth > 200 ? "large" : "small";

  let elementSettings;

  let selectedProfile = {};

  $: {
    selectedProfile = $selectedProfileStore;
    showControlNameOverlay(selectedProfile);
    showOverlay;
  }

  function showControlNameOverlay(selectedProfile) {
    if (Object.keys(selectedProfile).length == 0) {
      showOverlay = true;
    } else {
      showOverlay = false;
      $appSettings.overlays.controlElementName = false;
    }
  }

  $: {
    const device = $runtime.find((controller) => controller.id == id);
    if (device !== undefined) {
      elementSettings = device.pages[0].control_elements;
    }
  }

  $: {
    try {
      let dx = +id.split(";")[0].split(":").pop();
      let dy = +id.split(";")[1].split(":").pop();

      const obj = $elementNameStore[dx][dy];

      Object.keys(obj).forEach((key) => {
        elementSettings[key].controlElementName = obj[key];
      });
    } catch (error) {}
  }
</script>

{#if showOverlay == true}
  {#if id.startsWith("PO16") || id.startsWith("BU16") || id.startsWith("EN16")}
    <div class="overlay">
      {#each [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]] as block, i}
        <div class="row" style="height: {moduleWidth / 4 + 'px'}">
          {#each block as element}
            <div
              class="col"
              style="height: {moduleWidth / 4 + 'px'}; width: {moduleWidth / 4 +
                'px'}; transform: rotate({1 * rotation * 90 -
                $appSettings.persistant.moduleRotation +
                'deg'})"
            >
              <ControlNameComponent
                elementName={elementSettings[element].controlElementName}
                elementNumber={element}
                {breakpoint}
              />
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else if id.startsWith("PBF4")}
    <div class="overlay">
      {#each [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]] as block, i}
        <div
          class="row"
          style="height: {(moduleWidth / 4) * (i == 1 ? 2 : 1) + 'px'}"
        >
          {#each block as element}
            <div
              class="col"
              style="height: {moduleWidth / 4 + 'px'}; width: {moduleWidth / 4 +
                'px'}; transform: rotate({1 * rotation * 90 -
                $appSettings.persistant.moduleRotation +
                'deg'})"
            >
              <ControlNameComponent
                elementName={elementSettings[element].controlElementName}
                elementNumber={element}
                {breakpoint}
              />
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else if id.startsWith("TEK2")}
    <div class="overlay">
      {#each [[8, 9], [0, 1, 2, 3], [4, 5, 6, 7]] as block, i}
        <div
          class="row"
          style="height: {(moduleWidth / 4) * (i == 0 ? 2 : 1) + 'px'}"
        >
          {#each block as element}
            <div>
              <ControlNameComponent
                elementName={elementSettings[element].controlElementName}
                elementNumber={element}
                {breakpoint}
              />
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {:else if id.startsWith("EF44")}
    <div class="overlay">
      {#each [[0, 1, 2, 3], [4, 5, 6, 7]] as block, i}
        <div
          class="row"
          style="height: {(moduleWidth / 4) * (i == 1 ? 3 : 1) + 'px'}"
        >
          {#each block as element}
            <div
              class="col"
              style="height: {moduleWidth / 4 + 'px'}; width: {moduleWidth / 4 +
                'px'}; transform: rotate({1 * rotation * 90 -
                $appSettings.persistant.moduleRotation +
                'deg'})"
            >
              <ControlNameComponent
                elementName={elementSettings[element].controlElementName}
                elementNumber={element}
                {breakpoint}
              />
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
    background-color: rgba(30, 30, 30, 0.8);
    border-radius: 0.5rem;
    justify-content: space-around;
    backdrop-filter: blur(1px);
    z-index: 50;
    color: white;
    display: flexbox;
    flex-direction: column;
  }
  .row {
    display: flex;
    justify-content: space-around;
    align-items: center;

    /* text-xs flex justify-around items-center w-full */
  }
  .col {
    display: flex;
    flex-direction: column;
    justify-content: space-around;

    /* flex flex-col items-center justify-center*/
  }
</style>
