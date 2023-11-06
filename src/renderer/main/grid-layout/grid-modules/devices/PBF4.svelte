<script>
  import { onMount, createEventDispatcher } from "svelte";

  import { appSettings } from "../../../../runtime/app-helper.store.js";

  import Potentiometer from "../elements/Potentiometer.svelte";
  import Led from "../elements/Led.svelte";
  import Fader from "../elements/Fader.svelte";
  import Button from "../elements/Button.svelte";

  import { elementPositionStore } from "../../../../runtime/runtime.store";
  import {
    unsaved_changes,
    ledColorStore,
  } from "../../../../runtime/runtime.store";

  export let id = "PBF4";
  export let selectedElement = { id: "", brc: {}, event: {} };
  export let rotation = 0;
  export let moduleWidth;

  const dispatch = createEventDispatcher();

  let dx, dy; // local device's dx dy coords for self check

  let elementposition_array = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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

  <!-- svelte-ignore a11y-click-events-have-key-events -->
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
      {#each [0, 1, 2, 3] as elementNumber}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <cell class="w-full h-full flex items-center justify-center relative">
          <unsaved-changes-underlay
            class="bg-white absolute rounded-lg bg-opacity-10 z-[1] row-span-1"
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
                type: "potentiometer",
                id: id,
              });
            }}
          >
            <Led color={ledcolor_array[elementNumber]} size={2.1} />
            <Potentiometer
              {elementNumber}
              {id}
              position={elementposition_array[elementNumber]}
              size={2.1}
            />
          </div>
        </cell>
      {/each}

      {#each [4, 5, 6, 7] as elementNumber}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <cell
          class="w-full h-full flex items-center justify-center relative row-span-2"
        >
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
                type: "fader",
                id: id,
              });
            }}
          >
            <Led color={ledcolor_array[elementNumber]} size={2.1} />

            <Fader
              {elementNumber}
              {id}
              position={elementposition_array[elementNumber]}
              size={2.1}
              rotation={rotation * -90}
              faderHeight={37}
            />
          </div>
        </cell>
      {/each}

      {#each [8, 9, 10, 11] as elementNumber}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <cell
          class="w-full h-full flex items-center justify-center relative row-span-1"
        >
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
            }}
          >
            <Led color={ledcolor_array[elementNumber]} size={2.1} />

            <Button
              {id}
              position={elementposition_array[elementNumber]}
              {elementNumber}
              size={2.1}
            />
          </div>
        </cell>
      {/each}
    </div>
  </div>
</div>
