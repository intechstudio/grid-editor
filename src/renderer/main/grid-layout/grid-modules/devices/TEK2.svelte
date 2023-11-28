<script>
  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import Button from "../elements/Button.svelte";
  import EndlessPot from "../elements/EndlessPot.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store.js";
  import { ledColorStore } from "../../../../runtime/runtime.store.js";

  export let moduleWidth;
  export let id = "TEK2";
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

  const ledPosRadius = -95;
</script>

<div
  class="module-dimensions relative"
  style="--module-size: {moduleWidth + 'px'}; transform: rotate({rotation *
    -90 +
    'deg'})"
>
  <div class="module-underlay-container">
    <slot name="module-underlay" {device} />
  </div>
  <div
    class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
  >
    {#each [8, 9] as elementNumber}
      <cell
        class="w-full h-full flex items-center justify-center relative col-span-2 row-span-2"
      >
        <div class="normal-cell-underlay-container">
          <slot name="cell-underlay" {elementNumber} />
        </div>
        <button
          ariarole="button"
          class="normal-cell-ui-container"
          style="border-radius: 50%; padding: 6px;"
        >
          {#each [0, 1, 2, 3, 4] as ledNumber}
            <div
              class="absolute"
              style="
                margin-left: {ledPosRadius *
                Math.cos(((25 + ledNumber * 10) / 180) * Math.PI)}px; 
                margin-top: {ledPosRadius *
                Math.sin(((25 + ledNumber * 10) / 180) * Math.PI)}px; 
              "
            >
              <Led
                color={ledcolor_array[
                  (elementNumber == 8 ? 8 : 9) + ledNumber * 2
                ]}
                size={1.4}
              />
            </div>
          {/each}

          <EndlessPot
            {elementNumber}
            {id}
            position={elementposition_array[elementNumber]}
            size={2.1}
          />
        </button>
        <div class="normal-cell-overlay-container">
          <slot name="cell-overlay" {elementNumber} />
        </div>
      </cell>
    {/each}

    {#each [0, 1, 2, 3, 4, 5, 6, 7, 255] as elementNumber}
      {#if elementNumber < 8}
        <cell class="w-full h-full flex items-center justify-center relative">
          <div class="normal-cell-underlay-container">
            <slot name="cell-underlay" {elementNumber} />
          </div>
          <button class="normal-cell-ui-container">
            <Led color={ledcolor_array[elementNumber]} size={2.1} />
            <Button
              {elementNumber}
              {id}
              position={elementposition_array[elementNumber]}
              size={2.1}
            />
          </button>
          <div class="normal-cell-overlay-container">
            <slot name="cell-overlay" {elementNumber} />
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
