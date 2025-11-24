<script lang="ts">
  import CalibrationButton from "./CalibrationButton.svelte";
  import { grid } from "@intechstudio/grid-protocol";
  import type { GridModule } from "../../../runtime/runtime";

  export let module: GridModule | undefined = undefined;
  export let onCalibrate: (code: string) => void;

  // Check what calibrations the selected module supports
  // - Potmeters: Center, Range, Detent Low, Detent High
  // - Buttons: Range only (RevH revision only)
  // - Other elements: no calibration
  $: hasCenterCalibration = module ? checkCenterCalibration(module) : false;
  $: hasRangeCalibration = module ? checkRangeCalibration(module) : false;
  $: hasDetentCalibration = module ? checkDetentCalibration(module) : false;

  function checkCenterCalibration(module: GridModule): boolean {
    const elementList = grid.get_module_element_list(module.type);
    return elementList.some((element) => element === "potmeter");
  }

  function checkRangeCalibration(module: GridModule): boolean {
    const elementList = grid.get_module_element_list(module.type);
    const hasPotmeter = elementList.some((element) => element === "potmeter");
    const hasButton = elementList.some((element) => element === "button");
    const isRevH = module.revision === "RevH";
    return hasPotmeter || (hasButton && isRevH);
  }

  function checkDetentCalibration(module: GridModule): boolean {
    const elementList = grid.get_module_element_list(module.type);
    return elementList.some((element) => element === "potmeter");
  }
</script>

<div class="flex flex-row flex-wrap gap-1">
  <CalibrationButton
    text="Center"
    code="local caldata = gpcg() gpcs(caldata) print(table.unpack(caldata))"
    onClick={onCalibrate}
    disabled={!hasCenterCalibration}
  />
  <CalibrationButton
    text="Range"
    code="local caldata = grcg() grcs(caldata) print(table.unpack(caldata))"
    onClick={onCalibrate}
    disabled={!hasRangeCalibration}
  />
  <CalibrationButton
    text="Detent Low"
    code="local caldata = gpcg() gpds(caldata, false) print(table.unpack(caldata))"
    onClick={onCalibrate}
    disabled={!hasDetentCalibration}
  />
  <CalibrationButton
    text="Detent High"
    code="local caldata = gpcg() gpds(caldata, true) print(table.unpack(caldata))"
    onClick={onCalibrate}
    disabled={!hasDetentCalibration}
  />
  <CalibrationButton
    text="Reset"
    code="gcr()"
    onClick={onCalibrate}
    style={"outlined"}
    disabled={!(
      hasCenterCalibration ||
      hasRangeCalibration ||
      hasDetentCalibration
    )}
  />
</div>
