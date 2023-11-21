<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { runtime, user_input } from "../../../../runtime/runtime.store";

  import { get } from "svelte/store";

  import { Analytics } from "../../../../runtime/analytics.js";

  import { appSettings } from "../../../../runtime/app-helper.store";

  export let device = undefined;
  export let visible = false;

  let selectedPreset;

  let controlElementSettings;

  $: {
    controlElementSettings = device?.pages[0].control_elements;
  }

  $: {
    if ($selectedConfigStore.configType === "preset") {
      selectedPreset = $selectedConfigStore;
    } else {
      selectedPreset = undefined;
    }
  }

  function loadPreset(element) {
    Analytics.track({
      event: "Preset Load Start",
      payload: {},
      mandatory: false,
    });

    if (selectedPreset !== undefined) {
      const preset = selectedPreset;

      const rt = get(runtime);
      const ui = get(user_input);

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

{#if visible || true}
  <container class="pointer-events-auto">
    <button
      on:click={loadPreset}
      class="bg-gray-300 bg-opacity-25 hover:bg-commit hover:bg-opacity-25
        h-full
    w-full text-white rounded
     focus:outline-none"
      ><div
        style="transform: rotate({-$appSettings.persistent.moduleRotation}deg)"
        class="hidden group-hover:block"
      >
        Load
      </div>
    </button>
  </container>
{/if}
