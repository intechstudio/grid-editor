<script>
  import { writable } from "svelte/store";

  import { engine, runtime } from "../../runtime/runtime.store.js";

  import Device from "./grid-modules/Device.svelte";

  import { fade, fly } from "svelte/transition";

  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "/main/_actions/click-outside.action";

  const devices = writable([]);

  function updateGridLayout() {
    n = n_new;
    m = m_new;
  }

  let [n, m] = [0, 0];
  let [n_new, m_new] = [undefined, undefined];

  $: if ($runtime.length > 0) {
    const rt = $runtime;
    let min_x = Math.min(...rt.map((e) => e.dx));
    let max_x = Math.max(...rt.map((e) => e.dx));
    let min_y = Math.min(...rt.map((e) => e.dy));
    let max_y = Math.max(...rt.map((e) => e.dy));

    //Create an NxN matrix
    n_new = Math.abs(min_x - max_x) + 1;
    m_new = Math.abs(min_y - max_y) + 1;

    //Arrival
    if (n_new > n || m_new > m) {
      updateGridLayout();
    }

    const newDevices = Array(m_new)
      .fill(null)
      .map(() => Array(n_new).fill(null));

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

      const x = device.dx + Math.abs(min_x);
      const y = device.dy + Math.abs(min_y);
      newDevices[y][x] = device;
    });

    devices.set(newDevices.reverse().flat());
  } else {
    n = 0;
    m = 0;
    devices.set([]);
  }
</script>

<layout-container
  class="{$$props.class} relative flex overflow-hidden"
  class:pointer-events-none={$engine != "ENABLED"}
>
  <div
    class="absolute grid grid-cols-{n} gap-1 bg-lime-300 w-fit h-fit bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2"
    use:clickOutside={{ useCapture: true }}
  >
    {#each $devices as device (device)}
      {#if device !== null}
        <div
          in:fly={{
            x: device.fly_x_direction * 100,
            y: device.fly_y_direction * 100,
            duration: 300,
          }}
          out:fade={{ duration: 150 }}
          id="grid-device-{'dx:' + device.dx + ';dy:' + device.dy}"
          class="transition-all"
          class:bg-error={device.fwMismatch}
          class:rounded-lg={device.fwMismatch}
          on:animationend={updateGridLayout}
        >
          <Device
            type={device.type}
            id={device.id}
            rotation={device.rot + $appSettings.persistant.moduleRotation / 90}
          />
        </div>
      {:else}
        <div class="w-full h-full invisible">Dummy (is not displayed)</div>
      {/if}
    {/each}
  </div>
</layout-container>
