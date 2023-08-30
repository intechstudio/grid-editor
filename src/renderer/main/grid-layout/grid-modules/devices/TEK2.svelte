<script>
  import { onMount } from "svelte";

  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import { selectElement } from "../event-handlers/select.js";

  import Button from "../elements/Button.svelte";
  import EndlessPot from "../elements/EndlessPot.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store.js";
  import { ledColorStore } from "../../../../runtime/runtime.store.js";

  export let moduleWidth;
  export let selectedElement = { id: "", brc: {}, event: {} };
  export let id = "TEK2";
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

  const ledPosRadius = -95;
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
      {#each [8, 9] as elementNumber}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class:active-element={dx == selectedElement.brc.dx &&
            dy == selectedElement.brc.dy &&
            selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led row-span-2 col-span-2 relative"
          style="border-radius: 50%; padding: 6px"
          on:click={() => selectElement(elementNumber, "button", id)}
        >
          <div
            class="absolute"
            style="
              margin-left: {ledPosRadius * Math.cos((25 / 180) * Math.PI)}px; 
              margin-top: {ledPosRadius * Math.sin((25 / 180) * Math.PI)}px; 
            "
          >
            <Led color={ledcolor_array[elementNumber]} size={1.4} />
          </div>
          <div
            class="absolute"
            style="
              margin-left: {ledPosRadius * Math.cos((35 / 180) * Math.PI)}px; 
              margin-top: {ledPosRadius * Math.sin((35 / 180) * Math.PI)}px; 
            "
          >
            <Led color={ledcolor_array[elementNumber]} size={1.6} />
          </div>
          <div
            class="absolute"
            style="
              margin-left: {ledPosRadius * Math.cos((45 / 180) * Math.PI)}px; 
              margin-top: {ledPosRadius * Math.sin((45 / 180) * Math.PI)}px; 
            "
          >
            <Led color={ledcolor_array[elementNumber]} size={1.7} />
          </div>
          <div
            class="absolute"
            style="
              margin-left: {ledPosRadius * Math.cos((55 / 180) * Math.PI)}px; 
              margin-top: {ledPosRadius * Math.sin((55 / 180) * Math.PI)}px; 
            "
          >
            <Led color={ledcolor_array[elementNumber]} size={1.6} />
          </div>
          <div
            class="absolute"
            style="
              margin-left: {ledPosRadius * Math.cos((65 / 180) * Math.PI)}px; 
              margin-top: {ledPosRadius * Math.sin((65 / 180) * Math.PI)}px; 
            "
          >
            <Led color={ledcolor_array[elementNumber]} size={1.4} />
          </div>

          <EndlessPot
            {elementNumber}
            {id}
            position={elementposition_array[elementNumber]}
            size={2.1}
          />
        </div>
      {/each}

      {#each [0, 1, 2, 3, 4, 5, 6, 7] as elementNumber}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class:active-element={dx == selectedElement.brc.dx &&
            dy == selectedElement.brc.dy &&
            selectedElement.event.elementnumber == elementNumber}
          class="knob-and-led"
          on:click={() => selectElement(elementNumber, "button", id)}
        >
          <Led color={ledcolor_array[elementNumber]} size={2.1} />
          <Button
            {elementNumber}
            {id}
            position={elementposition_array[elementNumber]}
            size={2.1}
          />
        </div>
      {/each}
    </div>
  </div>
</div>
