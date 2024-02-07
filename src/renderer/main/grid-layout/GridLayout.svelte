<script>
  import { watchResize } from "svelte-watch-resize";
  import { writable } from "svelte/store";
  import { runtime } from "../../runtime/runtime.store.js";
  import { appSettings } from "../../runtime/app-helper.store.js";
  import Device from "./grid-modules/Device.svelte";
  import { fade, fly } from "svelte/transition";
  import { derived } from "svelte/store";
  import { createEventDispatcher } from "svelte";

  export let component;

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

  $: calculateRotation($appSettings.persistent.moduleRotation);

  $: {
    if (typeof $runtime !== "undefined") {
      calculateDevices($runtime);
    }
  }

  $: handleScalingChange($scalingPercent);

  function handleResize(e) {
    dispatch("resize");
  }

  function handleScalingChange(value) {
    calculateLayoutDimensions(rotation, columns, rows, value);
  }

  function calculateLayoutDimensions(rotation, columns, rows, scale) {
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
    calculateLayoutDimensions(rotation, columns, rows, $scalingPercent);
  }

  function getGridDimensions() {
    const rt = $runtime;
    const min_x = Math.min(...rt.map((e) => e.dx));
    const min_y = Math.min(...rt.map((e) => e.dy));
    const max_x = Math.max(...rt.map((e) => e.dx));
    const max_y = Math.max(...rt.map((e) => e.dy));
    return {
      min_x: min_x,
      min_y: min_y,
      max_x: max_x,
      max_y: max_y,
      rows: rt.length > 0 ? Math.abs(min_y - max_y) + 1 : 0,
      columns: rt.length > 0 ? Math.abs(min_x - max_x) + 1 : 0,
    };
  }

  function calculateDevices(rt) {
    devices.update((s) => {
      const dim = getGridDimensions();
      const { min_x, min_y, max_y, max_x } = dim;
      s = [];

      rt.forEach((device, i) => {
        let connection_top = 0;
        let connection_bottom = 0;
        let connection_left = 0;
        let connection_right = 0;

        rt.forEach((neighbor) => {
          if (!(device.dx == neighbor.dx && device.dy == neighbor.dy)) {
            const dxDiff = device.dx - neighbor.dx;
            const dyDiff = device.dy - neighbor.dy;

            connection_right = dxDiff > 0 ? 1 : 0;
            connection_left = dxDiff < 0 ? 1 : 0;
            connection_bottom = dyDiff > 0 ? 1 : 0;
            connection_top = dyDiff < 0 ? 1 : 0;
          }
        });

        const [x, y] = [
          device.dx + (min_x < 0 ? Math.abs(min_x) : 0),
          Math.abs(device.dy - (max_y > 0 ? max_y : 0)),
        ];

        const obj = structuredClone(device);
        obj.fly_x_direction = connection_right - connection_left;
        obj.fly_y_direction = connection_top - connection_bottom;
        obj.type = rt[i].id.substr(0, 4);
        obj.gridX = x + 1;
        obj.gridY = y + 1;
        s.push(obj);
      });
      return s;
    });
  }

  let scalingPercent = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.persistent.size
  );

  function handleOutroEnd() {
    const dim = getGridDimensions();
    rows = dim.rows;
    columns = dim.columns;
    calculateLayoutDimensions(rotation, columns, rows, $scalingPercent);
  }

  function handleIntroStart() {
    const dim = getGridDimensions();
    rows = dim.rows;
    columns = dim.columns;
    calculateLayoutDimensions(rotation, columns, rows, $scalingPercent);
  }
</script>

<layout-container
  class="{$$props.class} "
  bind:this={component}
  use:watchResize={handleResize}
>
  <div
    style="width: {layoutWidth}px;  height: {layoutHeight}px;"
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
          {#each $devices as device (device.id)}
            {@const [x, y] = [device.gridX, device.gridY]}
            <div
              in:fly|global={{
                x: device.fly_x_direction * 100,
                y: device.fly_y_direction * 100,
                duration: 300,
              }}
              style="width: {deviceWidth * $scalingPercent}px; 
                height: {deviceWidth * $scalingPercent}px;
                grid-area: {`${y}/${x}/${y}/${x}`};"
              out:fade|global={{ duration: 200 }}
              on:outroend={handleOutroEnd}
              on:introstart={handleIntroStart}
              id="grid-device-{'dx:' + device.dx + ';dy:' + device.dy}"
            >
              <Device
                {device}
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
