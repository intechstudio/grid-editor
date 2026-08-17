<script lang="ts">
  import { GridModule, GridRuntime } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { Grid } from "../../../../lib/_utils";
  import { moduleOverlay } from "../../../../runtime/moduleOverlay";
  import CalibrationButtons from "../../../panels/DebugMonitor/CalibrationButtons.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  export let visible = false;
  export let device: GridModule;

  $: runtime = device?.parent as GridRuntime;

  // Match the device component's rotation: device?.rot * -90
  // Then counter-rotate with TOTAL rotation (moduleRotation + runtime.rotation)
  $: deviceRotValue = device?.rot ?? 0;
  $: deviceRotationDeg = deviceRotValue * -90;
  $: totalRotation = Grid.addRotations(
    $appSettings.persistent.moduleRotation,
    $runtime?.rotation ?? 0,
  );
  $: counterRotation = -deviceRotationDeg - totalRotation;

  function handleCalibrate(code: string) {
    device?.execConfigImmediate(code);
  }

  function handleClose() {
    moduleOverlay.close();
  }
</script>

{#if visible}
  <container>
    <div
      class="calibration-overlay-bg text-white w-full flex flex-col items-center justify-center rounded h-full absolute pointer-events-auto gap-4"
      style="transform: rotate({counterRotation}deg); border-radius: var(--grid-rounding);"
    >
      <CalibrationButtons
        module={device}
        onCalibrate={handleCalibrate}
        compact={false}
      />
    </div>
  </container>
{/if}

<style>
  .calibration-overlay-bg {
    background-color: var(--overlay-bg);
  }
</style>
