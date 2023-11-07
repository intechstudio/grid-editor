<script>
  import { onMount } from "svelte";

  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import { selectElement } from "../event-handlers/select.js";

  import Button from "../elements/Button.svelte";
  import EndlessPot from "../elements/EndlessPot.svelte";
  import Led from "../elements/Led.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store.js";
  import {
    unsaved_changes,
    ledColorStore,
  } from "../../../../runtime/runtime.store.js";

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
    class="module-dimensions"
    class:active-systemelement={dx == selectedElement.brc.dx &&
      dy == selectedElement.brc.dy &&
      selectedElement.event.elementnumber == 255}
    style="--module-size: {moduleWidth + 'px'}"
  >
    <div
      class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
    >
      {#each [8, 9] as elementNumber}
        {@const isSelected =
          dx == selectedElement.brc.dx &&
          dy == selectedElement.brc.dy &&
          selectedElement.event.elementnumber == elementNumber}
        {@const isChanged =
          typeof $unsaved_changes.find(
            (e) => e.x == dx && e.y == dy && e.element == elementNumber
          ) !== "undefined"}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <cell
          class="w-full h-full flex items-center justify-center relative col-span-2 row-span-2"
        >
          <underlay
            class="absolute rounded-full"
            class:bg-unsavedchange={isChanged && !isSelected}
            class:bg-opacity-10={isSelected}
            class:bg-opacity-20={isChanged && !isSelected}
            class:border={isChanged}
            class:border-unsavedchange={isChanged}
            class:bg-white={isSelected}
            class:hover:bg-white={!isSelected}
            class:hover:bg-opacity-5={!isSelected && !isChanged}
            class:hover:bg-opacity-10={!isSelected && isChanged}
            style="width: calc(100% - 32px); height: calc(100% - 32px)"
          >
            <button
              ariarole="button"
              class="knob-and-led absolute"
              style="border-radius: 50%; padding: 6px; width: calc(100%); height: calc(100%)"
              on:click={() => selectElement(elementNumber, "encoder", id)}
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
          </underlay>
        </cell>
      {/each}

      {#each [0, 1, 2, 3, 4, 5, 6, 7] as elementNumber}
        {@const isSelected =
          dx == selectedElement.brc.dx &&
          dy == selectedElement.brc.dy &&
          selectedElement.event.elementnumber == elementNumber}
        {@const isChanged =
          typeof $unsaved_changes.find(
            (e) => e.x == dx && e.y == dy && e.element == elementNumber
          ) !== "undefined"}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <cell class="w-full h-full flex items-center justify-center relative">
          <underlay
            class="absolute rounded-lg"
            class:bg-unsavedchange={isChanged && !isSelected}
            class:bg-opacity-10={isSelected}
            class:bg-opacity-20={isChanged && !isSelected}
            class:border={isChanged}
            class:border-unsavedchange={isChanged}
            class:bg-white={isSelected}
            class:hover:bg-white={!isSelected}
            class:hover:bg-opacity-5={!isSelected && !isChanged}
            class:hover:bg-opacity-10={!isSelected && isChanged}
            style="width: calc(100% - 8px); height: calc(100% - 8px)"
          >
            <button
              class="knob-and-led absolute"
              style="width: calc(100%); height: calc(100%)"
              on:click={() => selectElement(elementNumber, "button", id)}
            >
              <Led color={ledcolor_array[elementNumber]} size={2.1} />
              <Button
                {elementNumber}
                {id}
                position={elementposition_array[elementNumber]}
                size={2.1}
              />
            </button>
          </underlay>
        </cell>
      {/each}
    </div>
  </div>
</div>
