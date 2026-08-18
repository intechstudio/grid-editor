<script lang="ts">
  import { ModuleType, ElementType } from "@intechstudio/grid-protocol";

  import Button from "../elements/Button.svelte";
  import EndlessPot from "../elements/EndlessPot.svelte";
  import Led from "../elements/Led.svelte";
  import LcdAndMenuButtons from "../elements/LcdAndMenuButtons.svelte";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { GridModule, GridRuntime } from "../../../../runtime/runtime";
  import SquareButton from "../elements/SquareButton.svelte";

  export let moduleWidth;
  export let device: GridModule;
  export let id = device.type;

  let runtime = device.parent as GridRuntime;
  let eps = runtime?.elementPositionStore;
  let lcs = runtime?.ledColorStore;

  let [dx, dy] = [device?.dx, device?.dy];
  let moduleType = device?.type;

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

  const ledPosRadius = -95;

  let common_elements = [
    { type: ElementType.BUTTON, index: 0 },
    { type: ElementType.BUTTON, index: 1 },
    { type: ElementType.BUTTON, index: 2 },
    { type: ElementType.BUTTON, index: 3 },
    { type: ElementType.BUTTON, index: 4 },
    { type: ElementType.BUTTON, index: 5 },
    { type: ElementType.BUTTON, index: 6 },
    { type: ElementType.BUTTON, index: 7 },
  ];
  let elementArray = [];

  if (moduleType === ModuleType.VSN0 || moduleType === ModuleType.TEK2) {
    elementArray = [
      { type: ElementType.ENDLESS, index: 8 },
      { type: ElementType.ENDLESS, index: 9 },
      ...common_elements,
      { type: ElementType.SYSTEM, index: 10 },
    ];
  } else if (
    moduleType === ModuleType.VSN1L ||
    moduleType === ModuleType.TEK1
  ) {
    elementArray = [
      { type: ElementType.LCD, index: 13 },
      { type: ElementType.ENDLESS, index: 8 },
      ...common_elements,
      { type: ElementType.SYSTEM, index: 14 },
    ];
  } else if (moduleType === ModuleType.VSN1R) {
    elementArray = [
      { type: ElementType.ENDLESS, index: 8 },
      { type: ElementType.LCD, index: 13 },
      ...common_elements,
      { type: ElementType.SYSTEM, index: 14 },
    ];
  } else if (moduleType === ModuleType.VSN2) {
    elementArray = [
      { type: ElementType.LCD, index: 12 },
      { type: ElementType.LCD, index: 17 },
      ...common_elements,
      { type: ElementType.SYSTEM, index: 18 },
    ];
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
    class="grid grid-cols-4 grid-rows-4 h-full w-full justify-items-center items-center"
  >
    {#each elementArray as elementDescriptor, index}
      {#if elementDescriptor.type === ElementType.LCD}
        {@const elementNumberList = [
          elementDescriptor.index - 4,
          elementDescriptor.index - 3,
          elementDescriptor.index - 2,
          elementDescriptor.index - 1,
          elementDescriptor.index,
        ]}
        <LcdAndMenuButtons {elementNumberList} {elementposition_array}>
          <!-- Dynamic underlay workaround-->
          <svelte:fragment slot="cell-underlay-0">
            <slot name="cell-underlay" elementNumber={elementNumberList[0]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-underlay-1">
            <slot name="cell-underlay" elementNumber={elementNumberList[1]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-underlay-2">
            <slot name="cell-underlay" elementNumber={elementNumberList[2]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-underlay-3">
            <slot name="cell-underlay" elementNumber={elementNumberList[3]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-underlay-4">
            <slot name="cell-underlay" elementNumber={elementNumberList[4]} />
          </svelte:fragment>

          <!-- Dynamic overlay workaround-->
          <svelte:fragment slot="cell-overlay-0">
            <slot name="cell-overlay" elementNumber={elementNumberList[0]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-overlay-1">
            <slot name="cell-overlay" elementNumber={elementNumberList[1]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-overlay-2">
            <slot name="cell-overlay" elementNumber={elementNumberList[2]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-overlay-3">
            <slot name="cell-overlay" elementNumber={elementNumberList[3]} />
          </svelte:fragment>
          <svelte:fragment slot="cell-overlay-4">
            <slot name="cell-overlay" elementNumber={elementNumberList[4]} />
          </svelte:fragment>
        </LcdAndMenuButtons>
      {/if}

      {#if elementDescriptor.type === ElementType.ENDLESS}
        {@const elementNumber = elementDescriptor.index}
        <cell
          class="w-full h-full flex items-center justify-center relative col-span-2 row-span-2"
        >
          <div class="normal-cell-underlay-container">
            <slot name="cell-underlay" {elementNumber} />
          </div>
          <div
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
                  color={ledcolor_array[index == 0 ? ledNumber : 5 + ledNumber]}
                  size={1.4}
                />
              </div>
            {/each}

            <EndlessPot
              {id}
              {elementNumber}
              position={elementposition_array[elementNumber][1]}
              size={2.1}
            />
          </div>
          <div class="normal-cell-overlay-container">
            <slot name="cell-overlay" {elementNumber} />
          </div>
        </cell>
      {/if}

      {#if elementDescriptor.type === ElementType.BUTTON && elementDescriptor.index < 8}
        {@const elementNumber = elementDescriptor.index}
        <cell class="w-full h-full flex items-center justify-center relative">
          <div class="normal-cell-underlay-container">
            <slot
              name="cell-underlay"
              {elementNumber}
              isLeftCut={elementNumber == 6}
              isRightCut={elementNumber == 5}
            />
          </div>
          <div class="normal-cell-ui-container">
            {#if [27, 59, 91, 123].includes(device.hwcfg)}
              <SquareButton
                {elementNumber}
                size={4.2}
                value={elementposition_array[elementNumber][1]}
                color={ledcolor_array[10 + elementNumber]}
              />
            {:else}
              <Button
                {elementNumber}
                size={2.1}
                color={ledcolor_array[10 + elementNumber]}
              />
            {/if}
          </div>
          <div class="normal-cell-overlay-container">
            <slot
              name="cell-overlay"
              {elementNumber}
              isLeftCut={elementNumber == 6}
              isRightCut={elementNumber == 5}
            />
          </div>
        </cell>
      {/if}

      {#if elementDescriptor.type === ElementType.SYSTEM}
        {@const elementNumber = 255}
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
      {/if}
    {/each}
  </div>
  <div class="module-overlay-container">
    <slot name="module-overlay" {device} />
  </div>
</div>
