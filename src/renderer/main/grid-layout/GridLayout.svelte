<script lang="ts">
  import { Architecture } from "@intechstudio/grid-protocol";
  import AddVirtualModule from "./../modals/AddVirtualModule.svelte";
  import { modal } from "./../modals/modal.store";
  import { watchResize } from "svelte-watch-resize";
  import { get, writable } from "svelte/store";
  import { appSettings } from "../../runtime/app-helper.store.js";
  import Device from "./grid-modules/Device.svelte";
  import { fade, fly } from "svelte/transition";
  import { derived } from "svelte/store";
  import { createEventDispatcher } from "svelte";
  import AddModuleButton from "./AddModuleButton.svelte";
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import { GridModule, GridRuntime } from "../../runtime/runtime";

  export let component;

  let runtime: GridRuntime;
  $: runtime = $runtime_manager.active.runtime;

  const dispatch = createEventDispatcher();

  const devices = writable([]);
  let columns = 0;
  let rows = 0;
  const deviceGap = 5;
  const deviceWidth = 225 + deviceGap + 1;

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

  $: calculateRotation($appSettings.persistent.moduleRotation);
  $: handleScalingChange($scalingPercent);

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
    width = columns * deviceWidth * scale;
    height = rows * deviceWidth * scale;
    layoutWidth = rotation == 0 || rotation == 180 ? width : height;
    layoutHeight = rotation == 90 || rotation == 270 ? width : height;
    shiftX = rotation == 90 || rotation == 180 ? layoutWidth : 0;
    shiftY = rotation == 270 || rotation == 180 ? layoutHeight : 0;
  }

  function calculateRotation(value) {
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
    calculateLayoutDimensions(rotation, $scalingPercent);
  }

  function getGridDimensions() {
    const active = get(runtime_manager).active.runtime;
    const min_x = Math.min(...active.modules.map((e) => e.dx));
    const min_y = Math.min(...active.modules.map((e) => e.dy));
    const max_x = Math.max(...active.modules.map((e) => e.dx));
    const max_y = Math.max(...active.modules.map((e) => e.dy));
    return {
      min_x: min_x,
      min_y: min_y,
      max_x: max_x,
      max_y: max_y,
      rows: active.modules.length > 0 ? Math.abs(min_y - max_y) + 1 : 0,
      columns: active.modules.length > 0 ? Math.abs(min_x - max_x) + 1 : 0,
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

  let scalingPercent = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.persistent.size
  );

  function handleOutroEnd() {
    calculateLayoutDimensions(rotation, $scalingPercent);
  }

  function handleIntroStart() {
    calculateLayoutDimensions(rotation, $scalingPercent);
  }

  function handleAddModuleButtonClicked(x, y) {
    modal.show({
      component: AddVirtualModule,
      args: { dx: x, dy: y },
    });
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
            width: {width}px;  height: {height}px;"
        >
          {#each $runtime.modules as module (module.id)}
            {@const props = calculateModuleProperties(module)}

            <div
              in:fly|global={{
                x: props.fly_x_direction * 100,
                y: props.fly_y_direction * 100,
                duration: 300,
              }}
              style="width: {deviceWidth * $scalingPercent}px; 
                height: {deviceWidth * $scalingPercent}px;
                grid-area: {`${props.gridY}/${props.gridX}/${props.gridY}/${props.gridX}`};"
              out:fade|global={{ duration: 200 }}
              on:outroend={handleOutroEnd}
              on:introstart={handleIntroStart}
              id="grid-device-{'dx:' + module.dx + ';dy:' + module.dy}"
              class="relative"
            >
              {#if module.architecture === Architecture.VIRTUAL}
                <!-- LEFT -->
                {#if typeof $devices.find((e) => e.dx === module.dx - 1 && e.dy === module.dy) === "undefined"}
                  <div
                    class="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 -ml-2 h-full"
                  >
                    <AddModuleButton
                      on:click={() =>
                        handleAddModuleButtonClicked(module.dx - 1, module.dy)}
                    />
                  </div>
                {/if}

                <!-- RIGHT -->
                {#if typeof $devices.find((e) => e.dx === module.dx + 1 && e.dy === module.dy) === "undefined"}
                  <div
                    class="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 -mr-2 h-full"
                  >
                    <AddModuleButton
                      on:click={() =>
                        handleAddModuleButtonClicked(module.dx + 1, module.dy)}
                    />
                  </div>
                {/if}

                <!-- BOTTOM -->
                {#if typeof $devices.find((e) => e.dy === module.dy - 1 && e.dx === module.dx) === "undefined"}
                  <div
                    class="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full -mb-2 w-full"
                  >
                    <AddModuleButton
                      on:click={() =>
                        handleAddModuleButtonClicked(module.dx, module.dy - 1)}
                    />
                  </div>
                {/if}

                <!-- TOP -->
                {#if typeof $devices.find((e) => e.dy === module.dy + 1 && e.dx === module.dx) === "undefined"}
                  <div
                    class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full -mt-2 w-full"
                  >
                    <AddModuleButton
                      on:click={() =>
                        handleAddModuleButtonClicked(module.dx, module.dy + 1)}
                    />
                  </div>
                {/if}
              {/if}
              <Device
                device={module}
                width={deviceWidth}
                style="transform-origin: top left; transform: scale({$scalingPercent})"
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
