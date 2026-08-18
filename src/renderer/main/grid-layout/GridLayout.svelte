<script lang="ts" context="module">
  export const DEVICE_GAP = 0;
  export const DEVICE_WIDTH = 225;
  export const LAYOUT_CELL_WIDTH = DEVICE_WIDTH + DEVICE_GAP + 1;
  export const GRID_GAP = 0; // 0.25rem gap between modules (4px)
</script>

<script lang="ts">
  import { Architecture } from "@intechstudio/grid-protocol";
  import AddVirtualModule from "./../modals/AddVirtualModule.svelte";
  import { Modal } from "./../modals/modal.store";
  import { watchResize } from "svelte-watch-resize";
  import { get, type Readable } from "svelte/store";
  import { appSettings } from "../../runtime/app-helper.store";
  import Device from "./grid-modules/Device.svelte";
  import { fade, fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";
  import { GridModule, GridRuntime } from "../../runtime/runtime";
  import AddButton from "../user-interface/AddButton.svelte";
  import { Grid } from "../../lib/_utils";

  export let component: HTMLElement = undefined;
  export let runtime: GridRuntime;
  export let scale: Readable<number>;
  export let interactive: boolean;

  const dispatch = createEventDispatcher();

  let columns = 0;
  let rows = 0;

  let layoutWidth = 0;
  let layoutHeight = 0;
  let shiftX = 0;
  let shiftY = 0;

  let width = 0;
  let height = 0;

  let rotation = 0;
  let rotationBuffer = 0;
  let trueRotation = 0;

  let layoutMargin = { left: 0, right: 0, top: 0, bottom: 0 };

  $: {
    const rotation = Grid.addRotations(
      $appSettings.persistent.moduleRotation,
      $runtime.rotation,
    );
    calculateRotation(rotation);
  }
  $: handleScalingChange($scale);

  function handleResize(e) {
    dispatch("resize");
  }

  function handleScalingChange(value) {
    calculateLayoutDimensions(rotation, value);
  }

  function calculateLayoutDimensions(rotation, scale) {
    const dim = getGridDimensions();
    rows = dim.rows;
    columns = dim.columns;
    // Account for gaps between modules (N modules = N-1 gaps)
    const gapWidth = Math.max(0, columns - 1) * GRID_GAP * scale;
    const gapHeight = Math.max(0, rows - 1) * GRID_GAP * scale;
    width = columns * LAYOUT_CELL_WIDTH * scale + gapWidth;
    height = rows * LAYOUT_CELL_WIDTH * scale + gapHeight;
    layoutWidth = rotation == 0 || rotation == 180 ? width : height;
    layoutHeight = rotation == 90 || rotation == 270 ? width : height;
    shiftX = rotation == 90 || rotation == 180 ? layoutWidth : 0;
    shiftY = rotation == 270 || rotation == 180 ? layoutHeight : 0;
  }

  function calculateRotation(value: Grid.Rotation) {
    rotationBuffer = rotation;
    rotation = value;

    let deltaRotation = rotation - rotationBuffer;
    if (deltaRotation > 180) {
      deltaRotation -= 360;
    }
    if (deltaRotation < -180) {
      deltaRotation += 360;
    }
    trueRotation += deltaRotation;
    calculateLayoutDimensions(rotation, get(scale));
  }

  function getGridDimensions() {
    const min_x = Math.min(...runtime.modules.map((e) => e.dx));
    const min_y = Math.min(...runtime.modules.map((e) => e.dy));
    const max_x = Math.max(...runtime.modules.map((e) => e.dx));
    const max_y = Math.max(...runtime.modules.map((e) => e.dy));

    if (interactive) {
      layoutMargin = {
        left:
          runtime.modules.find((e) => e.dx == min_x)?.architecture ==
          Architecture.VIRTUAL
            ? 30
            : 0,
        right:
          runtime.modules.find((e) => e.dx == max_x)?.architecture ==
          Architecture.VIRTUAL
            ? 30
            : 0,
        top:
          runtime.modules.find((e) => e.dy == max_y)?.architecture ==
          Architecture.VIRTUAL
            ? 30
            : 0,
        bottom:
          runtime.modules.find((e) => e.dy == min_y)?.architecture ==
          Architecture.VIRTUAL
            ? 30
            : 0,
      };
    }
    return {
      min_x: min_x,
      min_y: min_y,
      max_x: max_x,
      max_y: max_y,
      rows: runtime.modules.length > 0 ? Math.abs(min_y - max_y) + 1 : 0,
      columns: runtime.modules.length > 0 ? Math.abs(min_x - max_x) + 1 : 0,
    };
  }

  function calculateModuleProperties(device: GridModule) {
    let runtime = device.parent as GridRuntime;
    const dim = getGridDimensions();
    const { min_x, max_y } = dim;

    const connection = { top: 0, bottom: 0, left: 0, right: 0 };

    runtime.modules.forEach((neighbor) => {
      if (!(device.dx === neighbor.dx && device.dy === neighbor.dy)) {
        const dxDiff = device.dx - neighbor.dx;
        const dyDiff = device.dy - neighbor.dy;

        connection.right = dxDiff > 0 ? 1 : 0;
        connection.left = dxDiff < 0 ? 1 : 0;
        connection.bottom = dyDiff > 0 ? 1 : 0;
        connection.top = dyDiff < 0 ? 1 : 0;
      }
    });

    return {
      fly_x_direction: connection.right - connection.left,
      fly_y_direction: connection.top - connection.bottom,
      gridX: device.dx + (min_x < 0 ? Math.abs(min_x) : 0) + 1,
      gridY: Math.abs(device.dy - (max_y > 0 ? max_y : 0)) + 1,
    };
  }

  function handleOutroEnd() {
    calculateLayoutDimensions(rotation, get(scale));
  }

  function handleIntroStart() {
    calculateLayoutDimensions(rotation, get(scale));
  }

  function handleAddModuleButtonClicked(x: number, y: number) {
    new Modal.Window(AddVirtualModule).show({ dx: x, dy: y });
  }
</script>

<layout-container
  class={$$props.class}
  style={$$props.style}
  bind:this={component}
  use:watchResize={handleResize}
>
  <div
    style="width: {layoutWidth +
      layoutMargin.left +
      layoutMargin.right}px;  height: {layoutHeight +
      layoutMargin.top +
      layoutMargin.bottom}px;"
    class="relative"
  >
    <div
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      style="width: {width}px;  height: {height}px;"
    >
      <div
        class="absolute w-full h-full duration-500 transition-all"
        style="transform: rotate({trueRotation}deg);"
      >
        <div
          class="grid"
          style="grid-template-columns: repeat({columns}, auto);
          grid-template-rows: repeat({rows}, auto);
            gap: {GRID_GAP * $scale}px;
            width: {width}px;  height: {height}px;"
        >
          {#each $runtime.modules as device (device.id)}
            {@const props = calculateModuleProperties(device)}

            <div
              in:fly|global={{
                x: props.fly_x_direction * 100,
                y: props.fly_y_direction * 100,
                duration: interactive ? 300 : 0,
              }}
              style="width: {LAYOUT_CELL_WIDTH * $scale}px; 
                height: {LAYOUT_CELL_WIDTH * $scale}px;
                grid-area: {`${props.gridY}/${props.gridX}/${props.gridY}/${props.gridX}`};"
              out:fade|global={{ duration: interactive ? 200 : 0 }}
              on:outroend={handleOutroEnd}
              on:introstart={handleIntroStart}
              id="{interactive ? '' : `${device.id}-`}grid-device-{'dx:' +
                device.dx +
                ';dy:' +
                device.dy}"
              class="relative"
            >
              {#if device.architecture === Architecture.VIRTUAL && interactive}
                <!-- LEFT -->
                {#if typeof $runtime.modules.find((e) => e.dx === device.dx - 1 && e.dy === device.dy) === "undefined"}
                  <div
                    class="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 -ml-2 h-full"
                  >
                    <AddButton
                      onclick={() =>
                        handleAddModuleButtonClicked(device.dx - 1, device.dy)}
                    />
                  </div>
                {/if}

                <!-- RIGHT -->
                {#if typeof $runtime.modules.find((e) => e.dx === device.dx + 1 && e.dy === device.dy) === "undefined"}
                  <div
                    class="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 -mr-2 h-full"
                  >
                    <AddButton
                      onclick={() =>
                        handleAddModuleButtonClicked(device.dx + 1, device.dy)}
                    />
                  </div>
                {/if}

                <!-- BOTTOM -->
                {#if typeof $runtime.modules.find((e) => e.dy === device.dy - 1 && e.dx === device.dx) === "undefined"}
                  <div
                    class="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full -mb-2 w-full"
                  >
                    <AddButton
                      onclick={() =>
                        handleAddModuleButtonClicked(device.dx, device.dy - 1)}
                    />
                  </div>
                {/if}

                <!-- TOP -->
                {#if typeof $runtime.modules.find((e) => e.dy === device.dy + 1 && e.dx === device.dx) === "undefined"}
                  <div
                    class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full -mt-2 w-full"
                  >
                    <AddButton
                      onclick={() => {
                        handleAddModuleButtonClicked(device.dx, device.dy + 1);
                      }}
                    />
                  </div>
                {/if}
              {/if}
              <Device
                {device}
                width={LAYOUT_CELL_WIDTH}
                scale={$scale}
                {interactive}
              />
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
  <slot />
</layout-container>

<style>
  .animate-border-error {
    animation-name: error-animation;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: alternate-reverse;
    animation-timing-function: ease;
  }

  @keyframes error-animation {
    from {
      border-color: transparent;
    }
    to {
      border-color: #dc2626;
    }
  }
</style>
