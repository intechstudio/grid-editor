<script>
  import { writable, derived } from "svelte/store";

  import { runtime, user_input } from "../../runtime/runtime.store.js";

  import Device from "./grid-modules/Device.svelte";

  import { fade, fly } from "svelte/transition";

  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "/main/_actions/click-outside.action";

  const devices = writable([]);
  const deviceGap = 5;
  const deviceWidth = 225 + deviceGap;

  let shiftX = 0;
  let shiftY = 0;

  let rotation = $appSettings.persistant.moduleRotation;
  let rotationBuffer = $appSettings.persistant.moduleRotation;
  let trueRotation = $appSettings.persistant.moduleRotation;

  $: {
    const rt = $runtime;
    //Initial center shift
    shiftX = -deviceWidth / 2;
    shiftY = -deviceWidth / 2;

    //Compensate for rotation
    rotationBuffer = rotation;
    rotation = $appSettings.persistant.moduleRotation;

    let deltaRotation = rotation - rotationBuffer;
    if (deltaRotation > 180) {
      deltaRotation -= 360;
    }
    if (deltaRotation < -180) {
      deltaRotation += 360;
    }
    trueRotation += deltaRotation;

    if (rotation == 90 || rotation == 180) {
      shiftX += deviceWidth;
    }
    if (rotation == 180 || rotation == 270) {
      shiftY += deviceWidth;
    }

    //And the other transformations
    if (rt.length > 0) {
      const min_x = Math.min(...rt.map((e) => e.dx));
      const max_x = Math.max(...rt.map((e) => e.dx));
      const min_y = Math.min(...rt.map((e) => e.dy));
      const max_y = Math.max(...rt.map((e) => e.dy));

      switch (rotation) {
        case 0: {
          shiftX -= (deviceWidth / 2) * (min_x + max_x);
          shiftY -= (deviceWidth / 2) * (min_y + max_y) * -1;
          break;
        }
        case 90: {
          shiftY -= (deviceWidth / 2) * (min_x + max_x);
          shiftX -= (deviceWidth / 2) * (min_y + max_y);
          break;
        }
        case 180: {
          shiftX -= (deviceWidth / 2) * (min_x + max_x) * -1;
          shiftY -= (deviceWidth / 2) * (min_y + max_y);
          break;
        }
        case 270: {
          shiftY -= (deviceWidth / 2) * (min_x + max_x) * -1;
          shiftX -= (deviceWidth / 2) * (min_y + max_y) * -1;
          break;
        }
      }
    }

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

<layout-container class="{$$props.class} relative flex overflow-hidden">
  <div
    style="
      --device-width: {deviceWidth}px; 
      --shift-x: {shiftX}px; 
      --shift-y: {shiftY}px; 
      --scaling-percent: {$scalingPercent};
      --rotation-degree: {trueRotation}deg;
    "
    class="absolute centered"
    use:clickOutside={{ useCapture: true }}
  >
    {#each $devices as device (device)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        in:fly={{
          x: device.fly_x_direction * 100,
          y: device.fly_y_direction * 100,
          duration: 300,
        }}
        out:fade={{ duration: 150 }}
        id="grid-device-{'dx:' + device.dx + ';dy:' + device.dy}"
        style="top: {device.shift_y + 'px'};left:{device.shift_x + 'px'};"
        class="absolute transition-all box-border border-2 rounded-lg"
        class:border-transparent={device.dx != $user_input.brc.dx ||
          (device.dy != $user_input.brc.dy && !device.fwMismatch)}
        class:border-gray-500={device.dx == $user_input.brc.dx &&
          device.dy == $user_input.brc.dy &&
          !device.fwMismatch}
        class:animate-border-error={device.fwMismatch}
      >
        <Device
          type={device.type}
          id={device.id}
          arch={device.architecture}
          portstate={device.portstate}
          rotation={device.rot}
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
    transform-origin: center;
    transform: scale(var(--scaling-percent))
      translate(var(--shift-x), var(--shift-y)) rotate(var(--rotation-degree));
  }
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
