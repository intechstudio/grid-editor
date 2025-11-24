<script lang="ts">
  import { GridModule, GridRuntime } from "./../../../../runtime/runtime";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { Grid } from "../../../../lib/_utils";
  import CalibrationButtons from "../../../panels/DebugMonitor/CalibrationButtons.svelte";

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
    device?.execLUAImmediate(code);
  }
</script>

{#if visible}
  <container>
    <div
      class="text-white w-full flex flex-col items-center justify-center rounded h-full absolute pointer-events-auto bg-overlay"
      style="transform: rotate({counterRotation}deg); border-radius: var(--grid-rounding);"
    >
      <CalibrationButtons module={device} onCalibrate={handleCalibrate} />
    </div>
  </container>
{/if}
