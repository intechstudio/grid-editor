<script>
  import { writable, derived } from "svelte/store";

  import { engine, runtime } from "../../runtime/runtime.store.js";

  import Device from "./grid-modules/Device.svelte";

  import { fade, fly } from "svelte/transition";

  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "/main/_actions/click-outside.action";

  const devices = writable([]);
  const deviceGap = 5;
  const deviceWidth = 225 + deviceGap;

  let shiftX = 0;
  let shiftY = 0;

  $: {
    const rt = $runtime;
    const min_x = Math.min(...rt.map((e) => e.dx));
    const max_x = Math.max(...rt.map((e) => e.dx));
    const min_y = Math.min(...rt.map((e) => e.dy));
    const max_y = Math.max(...rt.map((e) => e.dy));

    //Initial center shift
    shiftX = -deviceWidth / 2;
    shiftY = -deviceWidth / 2;

    //And the other
    shiftX -= (deviceWidth / 2) * (min_x + max_x);
    shiftY -= (deviceWidth / 2) * (min_y + max_y) * -1;

    //Add scaling
    //shiftX *= $scalingPercent;
    //shiftY *= $scalingPercent;

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

      rt[i].fly_x_direction = connection_right - connection_left;
      rt[i].fly_y_direction = connection_top - connection_bottom;
      rt[i].type = rt[i].id.substr(0, 4);
      rt[i].shift_x = deviceWidth * rt[i].dx;
      rt[i].shift_y = -deviceWidth * rt[i].dy;
    });

    devices.set(rt);
  }

  let scalingPercent = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.persistant.size
  );
</script>

<layout-container
  class="{$$props.class} relative flex overflow-hidden"
  class:pointer-events-none={$engine != "ENABLED"}
>
  <div
    style="
      --device-width: {deviceWidth}px; 
      --shift-x: {shiftX}px; 
      --shift-y: {shiftY}px; 
      --scaling-percent: {$scalingPercent};
    "
    class="absolute centered transition-all duration-75 w-[300px] h-[300px]"
    use:clickOutside={{ useCapture: true }}
  >
    {#each $devices as device (device)}
      <div
        in:fly={{
          x: device.fly_x_direction * 100,
          y: device.fly_y_direction * 100,
          duration: 300,
        }}
        out:fade={{ duration: 150 }}
        id="grid-device-{'dx:' + device.dx + ';dy:' + device.dy}"
        style="top: {device.shift_y + 'px'};left:{device.shift_x + 'px'};"
        class="absolute"
        class:bg-error={device.fwMismatch}
        class:rounded-lg={device.fwMismatch}
      >
        <Device
          type={device.type}
          id={device.id}
          rotation={device.rot + $appSettings.persistant.moduleRotation / 90}
        />
      </div>
    {/each}
  </div>
  <slot />
</layout-container>

<style>
  .centered {
    top: 50%;
    left: 50%;
    transform-origin: top left;
    transform: scale(var(--scaling-percent))
      translate(var(--shift-x), var(--shift-y));
  }
</style>
