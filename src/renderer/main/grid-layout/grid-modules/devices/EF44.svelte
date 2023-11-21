<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import Encoder from "../elements/Encoder.svelte";
  import Fader from "../elements/Fader.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store";
  import { ledColorStore } from "../../../../runtime/runtime.store";

  export let moduleWidth;
  export let id = "EF44";
  export let device = undefined;

  let rotation = $appSettings.rotation;
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
  <div class="absolute z-[0] w-full h-full">
    <slot name="module-underlay" {device} />
  </div>
  <div
    class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
  >
    {#each [0, 1, 2, 3] as elementNumber}
      <cell
        class="w-full h-full flex items-center justify-center relative row-span-1"
      >
        <div class="absolute z-[0] w-full h-full">
          <slot name="cell-underlay" {elementNumber} />
        </div>
        <div
          class="knob-and-led absolute z-[1] w-full h-full pointer-events-none"
        >
          <Led color={ledcolor_array[elementNumber]} size={2.1} />
          <Encoder
            {elementNumber}
            {id}
            position={elementposition_array[elementNumber]}
            size={2.1}
          />
        </div>
        <div class="absolute z-[2] w-full h-full pointer-events-none">
          <slot name="cell-overlay" {elementNumber} />
        </div>
      </cell>
    {/each}

    {#each [4, 5, 6, 7] as elementNumber}
      <cell
        class="w-full h-full flex items-center justify-center relative row-span-3"
      >
        <div class="absolute z-[0] w-full h-full">
          <slot name="cell-underlay" {elementNumber} />
        </div>
        <div
          class="knob-and-led absolute z-[1] w-full h-full pointer-events-none"
        >
          <Led color={ledcolor_array[elementNumber]} size={2.1} />
          <Fader
            {elementNumber}
            {id}
            position={elementposition_array[elementNumber]}
            size={2.1}
            rotation={rotation * -90}
            faderHeight={68}
          />
        </div>
        <div class="absolute z-[2] w-full h-full pointer-events-none">
          <slot name="cell-overlay" {elementNumber} />
        </div>
      </cell>
    {/each}
  </div>
  <div class="absolute z-[2] w-full h-full pointer-events-none">
    <slot name="module-overlay" {device} />
  </div>
</div>
