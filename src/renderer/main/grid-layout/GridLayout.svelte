<script>
  import { writable, derived } from "svelte/store";

  import { engine, runtime } from "../../runtime/runtime.store.js";

  import Device from "./grid-modules/Device.svelte";

  import { fade, fly } from "svelte/transition";

  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "/main/_actions/click-outside.action";

  const devices = writable([]);

  $: {
    const rt = $runtime;

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
      console.log(rt[i]);
    });
    devices.set(rt);
  }

  let scalingPercent = derived(
    appSettings,
    ($appSettings) => 1 * $appSettings.size
  );

  $: console.log($scalingPercent);
</script>

<layout-container
  class="{$$props.class} relative flex overflow-hidden"
  class:pointer-events-none={$engine != "ENABLED"}
>
  <div
    style="transform: scale({$scalingPercent})"
    class="absolute p-4 bg-lime-300 w-fit h-fit left-1/2 bottom-1/2 translate-x-1/2 -translate-y-1/2"
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
        style="top: {-device.dy * 230 + 'px'};left:{device.dx * 230 + 'px'};"
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
</layout-container>
