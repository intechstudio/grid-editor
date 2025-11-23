<script lang="ts">
  import { GridModule } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { Grid } from "../../../../lib/_utils";

  export let visible = false;
  export let device: GridModule;
</script>

{#if visible}
  <container>
    <div
      class="text-white w-full flex flex-col items-center justify-center rounded h-full absolute pointer-events-auto bg-overlay"
      style="transform: rotate({-$appSettings.persistent.moduleRotation +
        Grid.Rotation.R90 * device?.rot}deg); border-radius: var(--grid-rounding);"
    >
      <p class="text-white text-center">calibration</p>
    </div>
  </container>
{/if}
