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

  let deviceXcount = 0;
  let deviceYcount = 0;
  let shiftX = 0;
  let shiftY = 0;

  $: {
    const rt = $runtime;
    deviceXcount =
      Math.abs(
        Math.min(...rt.map((e) => e.dx)) + Math.max(...rt.map((e) => e.dx))
      ) + 1;
    deviceYcount =
      Math.abs(
        Math.min(...rt.map((e) => e.dy)) + Math.max(...rt.map((e) => e.dy))
      ) + 1;
    shiftX = (deviceXcount * deviceWidth) / 2;
    shiftY = (deviceYcount * deviceWidth) / 2;

    console.log(shiftX, shiftY);

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
      rt[i].shift_x = 200 * rt[i].dx;
      rt[i].shift_y = 200 * rt[i].dy;
    });

    devices.set(rt);
  }

  let scalingPercent = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.size
  );
</script>

<layout-container
  class="{$$props.class} relative flex overflow-hidden"
  class:pointer-events-none={$engine != "ENABLED"}
>
  <div
    style="
      --device-width: {deviceWidth}px; 
      --shift-x: -{shiftX}px; 
      --shift-y: -{shiftY}px; 
      --scaling-percent: {$scalingPercent};
      width: calc({deviceXcount} * {deviceWidth}px);
      height: calc({deviceYcount} * {deviceWidth}px);
    "
    class="left-1/2 bottom-1/2 centered transition-all duration-75"
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
        style="top: {-device.dy * deviceWidth + 'px'};left:{device.dx *
          deviceWidth +
          'px'};"
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
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(var(--shift-x), var(--shift-y))
      scale(var(--scaling-percent));
  }
</style>
