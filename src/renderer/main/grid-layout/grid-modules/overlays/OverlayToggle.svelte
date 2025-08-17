<script lang="ts">
  import { appSettings } from "../../../runtime/app-helper.store";

  let { type } = $props();

  let activated = $state(false);

  function toggleOverlay() {
    activated = !activated;

    appSettings.update((settings) => {
      settings.overlays[type] = activated;
      return settings;
    });
  }
</script>

<div
  onclick={toggleOverlay}
  class:bg-highlight-400={activated}
  class="ml-2 rounded-full w-6 hover:bg-highlight cursor-pointer text-center"
>
  👁️
</div>
