<script lang="ts">
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { GridModule, GridRuntime } from "../../../../runtime/runtime.js";

  import Encoder from "../elements/Encoder.svelte";
  import Fader from "../elements/Fader.svelte";
  import PianoButton from "../elements/PianoButton.svelte";
  import Led from "../elements/Led.svelte";

  export let moduleWidth;
  export let id = "EF44";
  export let device: GridModule;

  let baseNote = "C";
  let ghostKeyNum = baseNote == "C" ? 13 : baseNote == "F" ? 15 : -1;

  let runtime = device.parent as GridRuntime;
  let eps = runtime?.elementPositionStore;
  let lcs = runtime?.ledColorStore;

  let [dx, dy] = [device?.dx, device?.dy];

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

  $: if (id) {
    if (id !== undefined && id.length > 4) {
      dx = +id.split(";")[0].split(":").pop();
      dy = +id.split(";")[1].split(":").pop();
    }
  }
</script>

<div
  {...$$restProps}
  class="module-dimensions relative bg-background"
  style="--module-size: {moduleWidth + 'px'}; transform: rotate({device?.rot *
    -90}deg)"
>
  <div class="module-underlay-container">
    <slot name="module-underlay" {device} />
  </div>
  <div
    class="grid grid-cols-4 grid-rows-2 h-full w-full justify-items-center items-center"
  >
    {#each [0, 1, 2, 3, 4, 5, 6, 7] as elementNumber}
      <cell
        class="w-full h-full flex items-center justify-center relative row-span-1"
      >
        <div class="normal-cell-underlay-container">
          <slot name="cell-underlay" {elementNumber} />
        </div>
        <div class="normal-cell-ui-container">
          <Encoder
            {elementNumber}
            size={2.1}
            color={ledcolor_array[elementNumber]}
          />
        </div>
        <div class="normal-cell-overlay-container">
          <slot name="cell-overlay" {elementNumber} />
        </div>
      </cell>
    {/each}
  </div>
  <div
    style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr));"
    class="px-5 grid grid-rows-1 h-1/2 w-full justify-items-center items-center"
  >
    {#each [9, 11, 13, 15, 17, 19] as elementNumber}
      {#if elementNumber != ghostKeyNum}
        <cell
          class="w-full h-full flex items-start justify-center relative row-span-1"
        >
          <div class="normal-cell-underlay-container">
            <slot name="cell-underlay" {elementNumber} />
          </div>
          <div class="normal-cell-ui-container">
            <PianoButton
              {elementNumber}
              value={elementposition_array[elementNumber][1]}
              size={2.2}
              color={ledcolor_array[elementNumber]}
            />
          </div>
          <div class="normal-cell-overlay-container">
            <slot name="cell-overlay" {elementNumber} />
          </div>
        </cell>
      {:else}
        <cell
          class="w-full h-full flex items-start justify-center relative row-span-1"
        >
        </cell>
      {/if}
    {/each}
  </div>
  <div
    style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));"
    class="grid grid-rows-1 h-1/2 w-full justify-items-center items-center"
  >
    {#each [8, 10, 12, 14, 16, 18, 20] as elementNumber}
      <cell
        class="w-full h-full flex items-start justify-center relative row-span-1"
      >
        <div class="normal-cell-underlay-container">
          <slot name="cell-underlay" {elementNumber} />
        </div>
        <div class="normal-cell-ui-container">
          <PianoButton
            {elementNumber}
            value={elementposition_array[elementNumber][1]}
            size={2.2}
            color={ledcolor_array[elementNumber]}
          />
        </div>
        <div class="normal-cell-overlay-container">
          <slot name="cell-overlay" {elementNumber} />
        </div>
      </cell>
    {:else}{/each}
    {#each [255] as elementNumber}
      <div
        class="bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] system-cell-underlay-container"
      >
        <slot name="cell-underlay" {elementNumber} />
      </div>
      <div
        class="bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] system-cell-overlay-container"
      >
        <slot name="cell-overlay" {elementNumber} />
      </div>
    {/each}
  </div>
  <div class="module-overlay-container">
    <slot name="module-overlay" {device} />
  </div>
</div>
