<script lang="ts">
  import { ModuleType } from "@intechstudio/grid-protocol";

  import Btn from "../elements/Btn.svelte";
  import Encoder from "../elements/Encoder.svelte";
  import Potentiometer from "../elements/Potentiometer.svelte";
  import Led from "../elements/Led.svelte";

  import { GridModule, GridRuntime } from "../../../../runtime/runtime";
  import SquareButton from "../elements/SquareButton.svelte";

  export let moduleWidth;
  export let device: GridModule;
  export let id = device.type;

  let [dx, dy] = [device?.dx, device?.dy];
  let moduleType = device?.type;

  let runtime = device.parent as GridRuntime;
  let eps = runtime?.elementPositionStore;
  let lcs = runtime?.ledColorStore;

  let elementposition_array = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  let ledcolor_array = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  $: {
    const value = $eps;
    try {
      let eps = value[dx][dy];

      for (const key in eps) {
        elementposition_array[key] = eps[key];
      }
    } catch (error) {
      //ERROR
    }
  }

  $: {
    const value = $lcs;
    try {
      let lcs = value[dx][dy];

      for (const key in lcs) {
        ledcolor_array[key] = lcs[key];
      }
    } catch (error) {
      //ERROR
    }
  }
</script>

<div
  data-testid="{moduleType}_dx:{dx};dy:{dy}"
  class="module-dimensions relative"
  style="--module-size: {moduleWidth + 'px'}; transform: rotate({device?.rot *
    -90}deg)"
>
  <div class="module-underlay-container">
    <slot name="module-underlay" {device} />
  </div>
  <div
    class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
  >
    {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255] as elementNumber}
      {#if elementNumber < 16}
        <cell class="w-full h-full flex items-center justify-center relative">
          <div class="normal-cell-underlay-container">
            <slot
              name="cell-underlay"
              {elementNumber}
              isLeftCut={elementNumber == 14}
              isRightCut={elementNumber == 13}
            />
          </div>
          <div class="normal-cell-ui-container">
            {#if moduleType !== ModuleType.BU16 || device.revision !== "RevH"}
              <Led color={ledcolor_array[elementNumber]} size={2.1} />
            {/if}
            {#if moduleType === ModuleType.BU16}
              {#if device.revision === "RevH"}
                <SquareButton
                  {elementNumber}
                  size={4.2}
                  value={elementposition_array[elementNumber][1]}
                >
                  <div
                    class="absolute left-1/2 -translate-x-1/2 top-0"
                    style="margin-top: 4px;"
                  >
                    <Led color={ledcolor_array[elementNumber]} size={2.1} />
                  </div>
                </SquareButton>
              {:else}
                <Btn {elementNumber} size={2.1} />
              {/if}
            {:else if moduleType === ModuleType.PO16}
              <Potentiometer
                {id}
                {elementNumber}
                position={elementposition_array[elementNumber][1]}
                size={2.1}
              />
            {:else if moduleType === ModuleType.EN16}
              <Encoder {elementNumber} size={2.1} />
            {/if}
          </div>
          <div class="normal-cell-overlay-container">
            <slot
              name="cell-overlay"
              {elementNumber}
              isLeftCut={elementNumber == 14}
              isRightCut={elementNumber == 13}
            />
          </div>
        </cell>
      {:else}
        <div
          class="bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] rounded-t-full system-cell-underlay-container"
        >
          <slot name="cell-underlay" {elementNumber} />
        </div>
        <div
          class="bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] rounded-t-full system-cell-overlay-container"
        >
          <slot name="cell-overlay" {elementNumber} />
        </div>
      {/if}
    {/each}
  </div>
  <div class="module-overlay-container">
    <slot name="module-overlay" {device} />
  </div>
</div>
