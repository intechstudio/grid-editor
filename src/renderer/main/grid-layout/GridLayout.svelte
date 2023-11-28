<script>
  import { writable } from "svelte/store";

  import { runtime, user_input } from "../../runtime/runtime.store.js";
  import { appSettings } from "../../runtime/app-helper.store.js";

  import Device from "./grid-modules/Device.svelte";

  import { fade, fly } from "svelte/transition";

  import * as eases from "svelte/easing";
  import { derived } from "svelte/store";

  let moduleBorderWidth = 2;

  const devices = writable([]);
  let columns = 0;
  let rows = 0;
  const deviceGap = 5;
  const deviceWidth = 225 + deviceGap + 1;

  let layoutWidth = 0;
  let layoutHeight = 0;
  let shiftX = 0;
  let shiftY = 0;

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

  function handleScalingChange(value) {
    calculateLayoutDimensions(rotation, columns, rows, value);
  }

  function calculateLayoutDimensions(rotation, columns, rows, scale) {
    const width = columns * deviceWidth * scale;
    const height = rows * deviceWidth * scale;
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

  function calculateDevices(rt) {
    devices.update((s) => {
      const min_x = Math.min(...rt.map((e) => e.dx));
      const min_y = Math.min(...rt.map((e) => e.dy));
      const max_x = Math.max(...rt.map((e) => e.dx));
      const max_y = Math.max(...rt.map((e) => e.dy));
      rows = rt.length > 0 ? Math.abs(min_y - max_y) + 1 : 0;
      columns = rt.length > 0 ? Math.abs(min_x - max_x) + 1 : 0;
      s = Array.from(Array(rows), () => Array(columns).fill(undefined));

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
          device.dy + Math.abs(min_y),
          device.dx + Math.abs(min_x),
        ];

        const obj = structuredClone(device);
        obj.fly_x_direction = connection_right - connection_left;
        obj.fly_y_direction = connection_top - connection_bottom;
        obj.type = rt[i].id.substr(0, 4);
        s[x][y] = obj;
      });

      s = s.reverse();
      return s;
    });
    calculateLayoutDimensions(rotation, columns, rows, $scalingPercent);
  }

  let scalingPercent = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.persistent.size
  );

  $: console.log(columns);
</script>

<layout-container class={$$props.class}>
  <div
    style="width: {layoutWidth}px;  height: {layoutHeight}px;"
    class="relative"
  >
    <div
      class="absolute grid grid-cols-{columns}"
      style="transform-origin: left top; transform: translate({shiftX}px, {shiftY}px) scale({$scalingPercent}) rotate({trueRotation}deg);"
    >
      {#each $devices as rows}
        {#each rows as device}
          {#if typeof device !== "undefined"}
            <div
              in:fly|global={{
                x: device.fly_x_direction * 100,
                y: device.fly_y_direction * 100,
                duration: 300,
              }}
              out:fade|global={{ duration: 150 }}
              id="grid-device-{'dx:' + device.dx + ';dy:' + device.dy}"
            >
              <Device {device} width={deviceWidth} />
            </div>
          {:else}
            <div class="h-32 w-32 bg-black border invisible" />
          {/if}
        {/each}
      {/each}
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
