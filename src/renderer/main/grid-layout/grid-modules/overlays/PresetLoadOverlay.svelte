<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { runtime, user_input } from "../../../../runtime/runtime.store";

  import { get } from "svelte/store";

  import { Analytics } from "../../../../runtime/analytics.js";

  import { appSettings } from "../../../../runtime/app-helper.store";

  export let id;

  export let rotation;

  let selectedPreset;

  let overlayDesign;
  let controlElementSettings;

  $: {
    const device = $runtime.find((controller) => controller.id == id);
    if (typeof device !== "undefined") {
      controlElementSettings = device.pages[0].control_elements;
    }
  }

  $: {
    if ($selectedConfigStore.configType === "preset") {
      selectedPreset = $selectedConfigStore;
    } else {
      selectedPreset = undefined;
    }
  }

  $: if (id) {
    if (id.startsWith("PBF4")) {
      overlayDesign = "3x4";
    } else if (id.startsWith("EF44")) {
      overlayDesign = "2x4";
    } else {
      overlayDesign = "4x4";
    }
  }

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

    Analytics.track({
      event: "Preset Load Start",
      payload: {},
      mandatory: false,
    });

    if (selectedPreset !== undefined) {
      const preset = selectedPreset;

      const rt = get(runtime);
      const ui = get(user_input);
      const currentModule = rt.find(
        (device) => device.dx == ui.brc.dx && device.dy == ui.brc.dy
      );

      if (ui.event.elementtype == preset.type) {
        runtime.element_preset_load(preset);

        Analytics.track({
          event: "Preset Load Success",
          payload: {},
          mandatory: false,
        });
      } else {
        Analytics.track({
          event: "Preset Load Mismatch",
          payload: {},
          mandatory: false,
        });
      }
    }
  }
</script>

{#if "system" == selectedPreset?.type}
  <div
    class=" overlay text-white w-full h-full justify-items-center items-end gap-1"
  >
    <button
      on:click={() => {
        loadPreset(controlElementSettings[controlElementSettings.length - 1]);
      }}
      class="group bg-gray-300 hover:bg-commit hover:bg-opacity-100
block h-full w-full text-white bg-opacity-25 rounded focus:outline-none"
      ><div
        style="transform: rotate({rotation * 90 -
          $appSettings.persistent.moduleRotation +
          'deg'})"
        class="hidden group-hover:block"
      >
        Load
      </div>
    </button>
  </div>
{:else}
  <div
    class=" overlay text-white w-full h-full justify-items-center items-end gap-1 grid-cols-4 grid-rows-4 {overlayDesign ==
    '3x4'
      ? 'pbf4'
      : overlayDesign == '2x4'
      ? 'ef44'
      : ''} grid"
  >
    {#each controlElementSettings.slice(0, -1) as element}
      <div class="h-full w-full">
        {#if element.controlElementType == selectedPreset?.type}
          <button
            on:click={() => {
              loadPreset(element);
            }}
            class="group bg-gray-300 hover:bg-commit-saturate-20
        opacity-80 block h-full
    w-full text-white bg-opacity-25 rounded
     focus:outline-none"
            ><div
              style="transform: rotate({rotation * 90 -
                $appSettings.persistent.moduleRotation +
                'deg'})"
              class="hidden group-hover:block"
            >
              Load
            </div>
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
    background-color: rgba(30, 30, 30, 0.3);
    border-radius: 0.5rem;
    backdrop-filter: blur(0.5px);
    z-index: 50;
  }

  .pbf4 {
    grid-template-rows: 1fr 2fr 1fr;
  }

  .ef44 {
    grid-template-rows: 1fr 3fr;
  }
</style>
