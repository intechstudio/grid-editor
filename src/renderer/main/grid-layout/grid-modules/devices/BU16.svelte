<script>
  import { onMount, createEventDispatcher } from "svelte";

  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import Button from "../elements/Button.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store";
  import {
    unsaved_changes,
    ledColorStore,
  } from "../../../../runtime/runtime.store";

  export let moduleWidth;
  export let selectedElement = { id: "", brc: {}, event: {} };
  export let id = "BU16";
  export let rotation = 0;

  const dispatch = createEventDispatcher();

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
    class="module-dimensions"
    class:active-systemelement={dx == selectedElement.brc.dx &&
      dy == selectedElement.brc.dy &&
      selectedElement.event.elementnumber == 255}
    style="--module-size: {moduleWidth + 'px'}"
  >
    <div
      class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
    >
      {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as elementNumber}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <cell class="w-full h-full flex items-center justify-center relative">
          <unsaved-changes-underlay
            class="bg-white absolute rounded-lg bg-opacity-10 z-[1]"
            class:hidden={typeof $unsaved_changes.find(
              (e) => e.x == dx && e.y == dy && e.element == elementNumber
            ) === "undefined"}
            style="width: calc(100% - 5px); height: calc(100% - 5px)"
          />
          <div
            class:active-element={dx == selectedElement.brc.dx &&
              dy == selectedElement.brc.dy &&
              selectedElement.event.elementnumber == elementNumber}
            class="knob-and-led z-[2]"
            on:click={() => {
              dispatch("click", {
                elementNumber: elementNumber,
                type: "button",
                id: id,
              });
              elementNumber;
            }}
          >
            <Led color={ledcolor_array[elementNumber]} size={2.1} />
            <Button
              {elementNumber}
              {id}
              position={elementposition_array[elementNumber]}
              size={2.1}
            />
          </div>
        </cell>
      {/each}
    </div>
  </div>
</div>
