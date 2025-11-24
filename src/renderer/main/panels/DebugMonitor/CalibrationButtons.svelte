<script lang="ts">
  import CalibrationButton from "./CalibrationButton.svelte";
  import { grid } from "@intechstudio/grid-protocol";
  import type { GridModule } from "../../../runtime/runtime";

  export let module: GridModule | undefined = undefined;
  export let onCalibrate: (code: string) => void;
  export let compact: boolean = true;

  // Check what calibrations the selected module supports
  // - Potmeters: Center, Range, Detent Low, Detent High
  // - Faders: Range only
  // - Buttons: Range only (RevH revision only)
  // - Other elements: no calibration

  // Cache element list to avoid multiple lookups
  $: elementList = module ? grid.get_module_element_list(module.type) : [];
  $: hasPotmeter = elementList.some((element) => element === "potmeter");
  $: hasFader = elementList.some((element) => element === "fader");
  $: hasButton = elementList.some((element) => element === "button");
  $: isRevH = module?.revision === "RevH";

  // Center and Detent calibrations are only for potmeters
  $: hasCenterCalibration = hasPotmeter;
  $: hasDetentCalibration = hasPotmeter;

  // Range calibration is for potmeters, faders, or RevH buttons
  $: hasRangeCalibration = hasPotmeter || hasFader || (hasButton && isRevH);

  // Button configurations
  $: buttons = [
    {
      text: "Center",
      code: "local caldata = gpcg() gpcs(caldata) print('INFO: Calibration Center', table.unpack(caldata))",
      tooltipKey: "calibration_center",
      enabled: hasCenterCalibration,
    },
    {
      text: "Range",
      code: "local caldata = grcg() grcs(caldata) print('INFO: Calibration Range', table.unpack(caldata))",
      tooltipKey: "calibration_range",
      enabled: hasRangeCalibration,
    },
    {
      text: "Detent Low",
      code: "local caldata = gpcg() gpds(caldata, false) print('INFO: Calibration Detent Low', table.unpack(caldata))",
      tooltipKey: "calibration_detent_low",
      enabled: hasDetentCalibration,
    },
    {
      text: "Detent High",
      code: "local caldata = gpcg() gpds(caldata, true) print('INFO: Calibration Detent High', table.unpack(caldata))",
      tooltipKey: "calibration_detent_high",
      enabled: hasDetentCalibration,
    },
    {
      text: "Delete Calibration",
      code: "gcr()",
      tooltipKey: "calibration_reset",
      enabled:
        hasCenterCalibration || hasRangeCalibration || hasDetentCalibration,
      confirm: true,
    },
  ];

  $: hasAnyCalibration = buttons.some((btn) => btn.enabled);
</script>

{#if !compact && !hasAnyCalibration}
  <div class="text-center py-2" style="color: var(--foreground-muted);">
    No calibration is available!
  </div>
{:else}
  <div
    class="flex gap-1 {compact
      ? 'flex-row flex-wrap'
      : 'flex-col items-center'}"
  >
    {#each buttons.filter((btn) => compact || btn.enabled) as button (button.text)}
      <CalibrationButton
        text={button.text}
        code={button.code}
        tooltipKey={compact ? undefined : button.tooltipKey}
        onClick={onCalibrate}
        style={button.style}
        confirm={!compact && button.confirm}
        disabled={!button.enabled}
      />
    {/each}
  </div>
{/if}
