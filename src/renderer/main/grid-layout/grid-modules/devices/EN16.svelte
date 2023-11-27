<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import Encoder from "../elements/Encoder.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store";
  import { ledColorStore } from "../../../../runtime/runtime.store";

  export let moduleWidth;
  export let id = "EN16";
  export let rotation = 0;
  export let device = undefined;

  let [dx, dy] = [device?.dx, device?.dy];

  let elementposition_array = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
    const value = $elementPositionStore;
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
    const value = $ledColorStore;
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
  class="module-dimensions relative"
  style="--module-size: {moduleWidth + 'px'}; transform: rotate({rotation *
    -90 +
    'deg'})"
>
  <div class="absolute w-full h-full">
    <slot name="module-underlay" {device} />
  </div>
  <div
    class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
  >
    {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 255] as elementNumber}
      {#if elementNumber < 16}
        <cell class="w-full h-full flex items-center justify-center relative">
          <div class="absolute w-full h-full z-[1]">
            <slot
              name="cell-underlay"
              {elementNumber}
              isLeftCut={elementNumber == 14}
              isRightCut={elementNumber == 13}
            />
          </div>
          <div class="knob-and-led absolute w-full h-full z-[3]">
            <Led color={ledcolor_array[elementNumber]} size={2.1} />
            <Encoder
              {elementNumber}
              {id}
              position={elementposition_array[elementNumber]}
              size={2.1}
            />
          </div>
          <div class="absolute w-full h-full z-[4]">
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
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] rounded-t-full z-[1]"
        >
          <slot name="cell-underlay" {elementNumber} />
        </div>
        <div
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] rounded-t-full z-[4]"
        >
          <slot name="cell-overlay" {elementNumber} />
        </div>
      {/if}
    {/each}
  </div>
  <div class="absolute w-full h-full z-[3]">
    <slot name="module-overlay" />
  </div>
</div>
