<script>
  import { writable, derived } from "svelte/store";

  import { runtime, user_input } from "../../runtime/runtime.store.js";

  import Device from "./grid-modules/Device.svelte";

  import { fade, fly } from "svelte/transition";

  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "/main/_actions/click-outside.action";
  import * as eases from "svelte/easing";

  const devices = writable([]);
  let columns = 0;

  $: handleRuntimeChange($runtime);

  function calculateColumns() {
    const rt = $runtime;
    const min_x = Math.min(...rt.map((e) => e.dx));
    const max_x = Math.max(...rt.map((e) => e.dx));
    columns = rt.length > 0 ? Math.abs(min_x - max_x) + 1 : 0;
  }

  function handleRuntimeChange(rt) {
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
    });

    devices.update((s) => {
      const rt = $runtime;
      const min_x = Math.min(...rt.map((e) => e.dx));
      const max_x = Math.max(...rt.map((e) => e.dx));
      const min_y = Math.min(...rt.map((e) => e.dy));
      const max_y = Math.max(...rt.map((e) => e.dy));
      const N = rt.length > 0 ? Math.abs(min_x - max_x) + 1 : 0;
      const M = rt.length > 0 ? Math.abs(min_y - max_y) + 1 : 0;

      s = Array.from(Array(M), () => Array(N).fill(undefined));
      rt.forEach((e) => {
        s[e.dy + Math.abs(min_y)][e.dx + Math.abs(min_x)] = e;
      });
      s = s.reverse();
      calculateColumns();
      return s;
    });
  }
</script>

<layout-container class={$$props.class} style={$$props.style}>
  <div
    class=" grid grid-cols-[{Array(columns)
      .fill('auto')
      .join('_')}] items-center justify-items-center"
  >
    {#each $devices as rows}
      {#each rows as device (device)}
        {#if typeof device !== "undefined"}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          {@const isSelected =
            device.dx == $user_input.brc.dx && device.dy == $user_input.brc.dy}
          {@const firmwareMismatch = device.fwMismatch}
          <div
            in:fly|global={{
              x: device.fly_x_direction * 100,
              y: device.fly_y_direction * 100,
              duration: 300,
              easing: eases.quadOut,
            }}
            out:fade|global={{ duration: 150 }}
            id={device.id}
            class="rounded-lg border-2"
            class:border-transparent={!isSelected && !firmwareMismatch}
            class:border-gray-500={isSelected}
            class:animate-border-error={firmwareMismatch}
          >
            <Device
              type={device.type}
              id={device.id}
              arch={device.architecture}
              portstate={device.portstate}
              fwVersion={device.fwVersion}
              rotation={device.rot}
            />
          </div>
        {:else}
          <div class="h-5 w-5 bg-black border" />
        {/if}
      {/each}
    {/each}
  </div>
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
