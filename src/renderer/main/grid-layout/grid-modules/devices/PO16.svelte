<script>
  import { onMount } from "svelte";

  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import { select } from "../event-handlers/select.js";

  import Potentiometer from "../elements/Potentiometer.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store";
  import { ledColorStore } from "../../../../runtime/runtime.store";

  export let id = "PO16";
  export let selectedElement = { id: "", brc: {}, event: {} };
  export let rotation = 0;
  export let moduleWidth;

  let dx, dy;

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

  elementPositionStore.subscribe((value) => {
    try {
      let eps = value[dx][dy];

      for (const key in eps) {
        elementposition_array[key] = eps[key];
      }
    } catch (error) {
      return;
    }
  });

  ledColorStore.subscribe((value) => {
    try {
      let lcs = value[dx][dy];

      for (const key in lcs) {
        ledcolor_array[key] = lcs[key];
      }
    } catch (error) {
      return;
    }
  });

  $: if (id) {
    if (id !== undefined && id.length > 4) {
      dx = +id.split(";")[0].split(":").pop();
      dy = +id.split(";")[1].split(":").pop();
    }
  }
</script>

<div
  {id}
  draggable={$appSettings.layoutMode}
  style="transform: rotate({rotation * -90 + 'deg'})"
>
  <slot />

  <div
    use:select
    class:disable-pointer-events={$appSettings.layoutMode}
    class="module-dimensions border-2  {dx == selectedElement.brc.dx &&
    dy == selectedElement.brc.dy
      ? ' border-gray-500'
      : 'border-transparent'} "
    class:active-systemelement={dx == selectedElement.brc.dx &&
      dy == selectedElement.brc.dy &&
      selectedElement.event.elementnumber == 255}
    style="--module-size: {moduleWidth + 'px'}"
  >
    <div
      class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center "
    >
      {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as elementNumber}
        <div
          class:active-element={dx == selectedElement.brc.dx &&
            dy == selectedElement.brc.dy &&
            selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led"
        >
          <Led color={ledcolor_array[elementNumber]} size={$appSettings.size} />
          <Potentiometer
            {elementNumber}
            {id}
            position={elementposition_array[elementNumber]}
            size={$appSettings.size}
          />
        </div>
      {/each}
    </div>
  </div>
</div>
