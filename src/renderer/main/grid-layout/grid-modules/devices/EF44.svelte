<script>
  import { onMount } from "svelte";

  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import { selectElement } from "../event-handlers/select.js";

  import Encoder from "../elements/Encoder.svelte";
  import Fader from "../elements/Fader.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store";
  import { ledColorStore } from "../../../../runtime/runtime.store";

  export let moduleWidth;
  export let selectedElement = { id: "", brc: {}, event: {} };
  export let id = "EF44";
  export let rotation = 0;

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
  {id}
  draggable={$appSettings.layoutMode}
  style="transform: rotate({rotation * -90 + 'deg'})"
>
  <slot />

  <div
    class:disable-pointer-events={$appSettings.layoutMode}
    class="module-dimensions border-2 {dx == selectedElement.brc.dx &&
    dy == selectedElement.brc.dy
      ? ' border-gray-500'
      : 'border-transparent'} "
    class:active-systemelement={dx == selectedElement.brc.dx &&
      dy == selectedElement.brc.dy &&
      selectedElement.event.elementnumber == 255}
    style="--module-size: {moduleWidth + 'px'}"
  >
    <div
      class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
    >
      {#each [0, 1, 2, 3] as elementNumber}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class:active-element={dx == selectedElement.brc.dx &&
            dy == selectedElement.brc.dy &&
            selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led row-span-1"
          on:click={() => selectElement(elementNumber, "encoder", id)}
        >
          <Led color={ledcolor_array[elementNumber]} size={2.1} />
          <Encoder
            {elementNumber}
            {id}
            position={elementposition_array[elementNumber]}
            size={2.1}
          />
        </div>
      {/each}

      {#each [4, 5, 6, 7] as elementNumber}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class:active-element={dx == selectedElement.brc.dx &&
            dy == selectedElement.brc.dy &&
            selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led row-span-3"
          on:click={() => selectElement(elementNumber, "fader", id)}
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
      {/each}
    </div>
  </div>
</div>
