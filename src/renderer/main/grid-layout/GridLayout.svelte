<script>
  import createPanZoom from "panzoom";
  import mixpanel from "mixpanel-browser";

  import { writable, readable, derived, get } from "svelte/store";

  import { onMount } from "svelte";

  import {
    engine,
    runtime,
    unsaved_changes,
  } from "../../runtime/runtime.store.js";

  import Device from "./grid-modules/Device.svelte";

  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  import { fade, fly } from "svelte/transition";

  import CursorLog from "../user-interface/cursor-log/CursorLog.svelte";

  import { appSettings } from "../../runtime/app-helper.store";

  import { clickOutside } from "/main/_actions/click-outside.action";
  import { selectedProfileStore } from "../../runtime/profile-helper.store";
  import { selectedPresetStore } from "../../runtime/preset-helper.store";
  import { writeBuffer } from "../../runtime/engine.store";
  import TooltipSetter from "../user-interface/tooltip/TooltipSetter.svelte";
  import TooltipConfirm from "../user-interface/tooltip/TooltipConfirm.svelte";

  import instructions from "../../serialport/instructions";

  import Pages from "/main/panels/configuration/components/Pages.svelte";

  const configuration = window.ctxProcess.configuration();

  export let classes;

  let map;

  let isMenuExtended = false;

  console.log("isMenuExtended", isMenuExtended);

  let surface_width = 0;
  let surface_height = 0;

  let surface_origin_x = 0;
  let surface_origin_y = 0;

  // $appSettings.size
  $: gridsize = 2.1 * 106.6 + 10;

  let ready = false;
  let isStoreEnabled = false;

  const totalChanges = derived(unsaved_changes, ($unsaved_changes) => {
    return $unsaved_changes.reduce((sum, item) => sum + item.changes, 0);
  });

  const devices = writable([]);

  $: {
    unsaved_changes.set(
      $unsaved_changes.filter((chg) =>
        $runtime.some((d) => chg.x === d.dx && chg.y === d.dy)
      )
    );
  }

  $: isStoreEnabled = $engine == "ENABLED" && $totalChanges > 0;

  onMount(() => {
    createPanZoom(map, {
      bounds: true,
      boundsPadding: 0.1,
      zoomDoubleClickSpeed: 1, //disable double click zoom
      smoothScroll: false, // disable the smoothing effect
      beforeMouseDown: function (e) {
        // allow mouse-down panning only if altKey is down. Otherwise - ignore
        var shouldIgnore = !e.ctrlKey;
        return shouldIgnore;
      },
      beforeWheel: function (e) {
        // ignore wheel zoom
        var shouldIgnore = !e.ctrlKey; //!e.altKey;
        return shouldIgnore;
      },
    });

    ready = true;
  });

  $: {
    let min_x = 0;
    let max_x = 0;
    let min_y = 0;
    let max_y = 0;
    const rt = $runtime;

    rt.forEach((device, i) => {
      let connection_top = 0;
      let connection_bottom = 0;
      let connection_left = 0;
      let connection_right = 0;

      rt.forEach((neighbor) => {
        const dxDiff = device.dx - neighbor.dx;
        const dyDiff = device.dy - neighbor.dy;

        connection_right = dxDiff > 0 ? 1 : 0;
        connection_left = dxDiff < 0 ? 1 : 0;
        connection_bottom = dyDiff > 0 ? 1 : 0;
        connection_top = dyDiff < 0 ? 1 : 0;
      });

      rt[i].fly_x = 100 * (connection_right - connection_left);
      rt[i].fly_y = 100 * (connection_top - connection_bottom);

      min_x = Math.min(min_x, device.dx);
      min_y = Math.min(min_y, device.dy);
      max_x = Math.max(max_x, device.dx);
      max_y = Math.max(max_y, device.dy);
    });

    surface_width = max_x - min_x + 1;
    surface_height = max_y - min_y + 1;

    surface_origin_x = (min_x + max_x) / 2;
    surface_origin_y = (min_y + max_y) / 2;

    devices.set(rt);
  }

  function refresh() {
    mixpanel.track("No Module Connected", {
      click: "Refresh",
    });

    setTimeout(() => {
      window.electron.restartApp();
    }, 500);
  }

  async function troubleshoot() {
    const url = configuration.DOCUMENTATION_TROUBLESHOOTING_URL;

    window.electron.openInBrowser(url);

    mixpanel.track("No Module Connected", {
      click: "Troubleshooting",
    });
  }

  function calculate_x(x0, y0) {
    const rot = ($appSettings.persistant.moduleRotation / 180) * Math.PI;

    let x_rot = x0 * Math.cos(rot) - y0 * Math.sin(rot);

    x_rot -=
      surface_origin_x * Math.cos(rot) - surface_origin_y * Math.sin(rot);

    return x_rot * 106.6 * $appSettings.size * 1.05;
  }
  function calculate_y(x0, y0) {
    const rot = ($appSettings.persistant.moduleRotation / 180) * Math.PI;

    let y_rot = x0 * Math.sin(rot) + y0 * Math.cos(rot);

    y_rot -=
      surface_origin_x * Math.sin(rot) + surface_origin_y * Math.cos(rot);

    return -1 * (y_rot * 106.6 * $appSettings.size * 1.05);
  }

  let map_h, map_w;

  async function debugWriteBuffer() {
    window.electron.discord.sendMessage({
      title: "Writebuffer",
      text: JSON.stringify(get(writeBuffer)).substring(0, 1000),
    });

    mixpanel.track("Writebuffer", {
      click: "Clear",
    });

    writeBuffer.clear();
    engine.set("ENABLED");
  }

  function store() {
    mixpanel.track("Page Config", {
      click: "Store",
    });

    instructions.sendPageStoreToGrid();
  }

  function clear() {
    instructions.sendPageClearToGrid();

    mixpanel.track("Page Config", {
      click: "Clear",
    });
  }

  function discard() {
    instructions.sendPageDiscardToGrid();

    mixpanel.track("Page Config", {
      click: "Discard",
    });
  }
</script>

<layout-container>
  <div
    class="relative flex items-start {classes} h-full {$engine == 'ENABLED'
      ? 'pointer-events-auto'
      : 'pointer-events-none'}"
  >
    <grid-layout
      class="relative overflow-hidden w-full flex flex-col h-full
    focus:outline-none border-none outline-none"
    >
      <Pages />
      <section class="relative inline-block mx-auto my-8">
        <div
          class="flex items-center bg-primary mb-2 py-2 px-3 gap-2 flex-wrap justify-center rounded-lg"
        >
          <div class="mr-4 text-white font-medium">
            {$totalChanges} active changes
          </div>
          <button
            on:click={() => {
              discard();
            }}
            class="relative {isStoreEnabled
              ? 'flex'
              : 'hidden gap-0'} items-center justify-center focus:outline-none
          rounded bg-select hover:bg-yellow-600 text-white py-1 w-24"
          >
            <div>Discard</div>
            <TooltipSetter key={"configuration_header_clear"} />
          </button>
          <button
            on:click={() => {
              store();
            }}
            class="relative {isStoreEnabled
              ? 'flex'
              : 'hidden gap-0'} items-center justify-center rounded
              focus:outline-none text-white py-1 w-24 bg-commit
              hover:bg-commit-saturate-20"
          >
            <div>Store</div>
            <TooltipSetter key={"configuration_header_store"} />
          </button>

          <button
            on:click={() => {
              clear();
            }}
            disabled={$engine != "ENABLED"}
            class="{$engine == 'ENABLED' ? 'hover:bg-red-500' : 'opacity-75'}
          relative flex items-center focus:outline-none justify-center rounded
            bg-select text-white py-1 w-24"
          >
            <div>Clear</div>
            <TooltipConfirm key={"configuration_header_clear"} />
            <TooltipSetter key={"configuration_header_clear"} />
          </button>

          <button
            on:click={debugWriteBuffer}
            class=" relative flex items-center focus:outline-none justify-center
          rounded bg-select text-white py-1
           w-48"
          >
            <span class="pr-2 text-gray-200 tracking-wider">
              {$engine}
              {$writeBuffer.length ? "[" + $writeBuffer.length + "]" : ""}
            </span>
            <svg
              class="w-5 h-5 p-0.5 fill-current {$engine == 'ENABLED'
                ? 'text-green-500'
                : 'text-red-500'}"
              viewBox="0 0 465 385"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24.0009 128.001H382.06L343.03 167.03C338.529 171.531 336
              177.635 336 184.001C336 190.366 338.529 196.471 343.03
              200.972C347.531 205.473 353.636 208.001 360.001 208.001C366.366
              208.001 372.471 205.473 376.972 200.972L456.972 120.972C459.201
              118.743 460.969 116.097 462.175 113.185C463.381 110.273 464.002
              107.152 464.002 104.001C464.002 100.849 463.381 97.7278 462.175
              94.8159C460.969 91.904 459.201 89.2582 456.972 87.0296L376.972
              7.02962C372.471 2.52863 366.366 -4.74256e-08 360.001 0C353.636
              4.74256e-08 347.531 2.52863 343.03 7.02962C338.529 11.5306 336
              17.6353 336 24.0006C336 30.366 338.529 36.4706 343.03
              40.9716L382.06 80.0006H24.0009C17.6357 80.0006 11.5312 82.5292
              7.03031 87.0301C2.52944 91.5309 0.000873566 97.6354 0.000873566
              104.001C0.000873566 110.366 2.52944 116.47 7.03031 120.971C11.5312
              125.472 17.6357 128.001 24.0009 128.001Z"
              />
              <path
                d="M440.001 256.001H81.9419L120.972 216.972C125.473 212.471
              128.001 206.366 128.001 200.001C128.001 193.635 125.473 187.531
              120.972 183.03C116.471 178.529 110.366 176 104.001 176C97.6355 176
              91.5309 178.529 87.0299 183.03L7.02987 263.03C4.80114 265.258
              3.0332 267.904 1.82701 270.816C0.620819 273.728 0 276.849 0
              280.001C0 283.152 0.620819 286.273 1.82701 289.185C3.0332 292.097
              4.80114 294.743 7.02987 296.972L87.0299 376.972C91.5309 381.473
              97.6355 384.001 104.001 384.001C110.366 384.001 116.471 381.473
              120.972 376.972C125.473 372.471 128.001 366.366 128.001
              360.001C128.001 353.635 125.473 347.531 120.972 343.03L81.9419
              304.001H440.001C446.366 304.001 452.471 301.472 456.971
              296.971C461.472 292.47 464.001 286.366 464.001 280.001C464.001
              273.635 461.472 267.531 456.971 263.03C452.471 258.529 446.366
              256.001 440.001 256.001Z"
              />
            </svg>
            <TooltipSetter key={"engine_clear"} />
          </button>
        </div>

        <!-- <div
          id="myDropdown"
          class=" absolute py-2 px-3 z-[1]
    w-full mx-auto my-0 bg-primary {isMenuExtended
            ? 'flex gap-2 justify-evenly  '
            : 'hidden'}"
        >
          <button
            on:click={() => {
              clear();
            }}
            disabled={$engine != "ENABLED"}
            class="{$engine == 'ENABLED'
              ? 'hover:bg-red-500 hover:border-red-500'
              : 'opacity-75'}
          relative flex items-center focus:outline-none justify-center rounded
           border-select bg-select border-2 text-white px-2 py-0.5 w-24"
          >
            <div>Clear</div>
            <TooltipConfirm key={"configuration_header_clear"} />
            <TooltipSetter key={"configuration_header_clear"} />
          </button>

          <button
            on:click={debugWriteBuffer}
            class=" relative flex items-center focus:outline-none justify-center
          rounded  border-select bg-select border-2 text-white px-2 py-0.5
           w-48 "
          >
            <span class="pr-2 text-gray-200 tracking-wider">
              {$engine}
              {$writeBuffer.length ? "[" + $writeBuffer.length + "]" : ""}
            </span>
            <svg
              class="w-5 h-5 p-0.5 fill-current {$engine == 'ENABLED'
                ? 'text-green-500'
                : 'text-red-500'}"
              viewBox="0 0 465 385"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24.0009 128.001H382.06L343.03 167.03C338.529 171.531 336
              177.635 336 184.001C336 190.366 338.529 196.471 343.03
              200.972C347.531 205.473 353.636 208.001 360.001 208.001C366.366
              208.001 372.471 205.473 376.972 200.972L456.972 120.972C459.201
              118.743 460.969 116.097 462.175 113.185C463.381 110.273 464.002
              107.152 464.002 104.001C464.002 100.849 463.381 97.7278 462.175
              94.8159C460.969 91.904 459.201 89.2582 456.972 87.0296L376.972
              7.02962C372.471 2.52863 366.366 -4.74256e-08 360.001 0C353.636
              4.74256e-08 347.531 2.52863 343.03 7.02962C338.529 11.5306 336
              17.6353 336 24.0006C336 30.366 338.529 36.4706 343.03
              40.9716L382.06 80.0006H24.0009C17.6357 80.0006 11.5312 82.5292
              7.03031 87.0301C2.52944 91.5309 0.000873566 97.6354 0.000873566
              104.001C0.000873566 110.366 2.52944 116.47 7.03031 120.971C11.5312
              125.472 17.6357 128.001 24.0009 128.001Z"
              />
              <path
                d="M440.001 256.001H81.9419L120.972 216.972C125.473 212.471
              128.001 206.366 128.001 200.001C128.001 193.635 125.473 187.531
              120.972 183.03C116.471 178.529 110.366 176 104.001 176C97.6355 176
              91.5309 178.529 87.0299 183.03L7.02987 263.03C4.80114 265.258
              3.0332 267.904 1.82701 270.816C0.620819 273.728 0 276.849 0
              280.001C0 283.152 0.620819 286.273 1.82701 289.185C3.0332 292.097
              4.80114 294.743 7.02987 296.972L87.0299 376.972C91.5309 381.473
              97.6355 384.001 104.001 384.001C110.366 384.001 116.471 381.473
              120.972 376.972C125.473 372.471 128.001 366.366 128.001
              360.001C128.001 353.635 125.473 347.531 120.972 343.03L81.9419
              304.001H440.001C446.366 304.001 452.471 301.472 456.971
              296.971C461.472 292.47 464.001 286.366 464.001 280.001C464.001
              273.635 461.472 267.531 456.971 263.03C452.471 258.529 446.366
              256.001 440.001 256.001Z"
              />
            </svg>
            <TooltipSetter key={"engine_clear"} />
          </button>
        </div> -->
      </section>

      <div
        id="grid-map"
        bind:this={map}
        bind:clientWidth={map_w}
        bind:clientHeight={map_h}
        style="top:{map_h / 2 - gridsize / 2}px; left:{map_w / 2 -
          gridsize / 2}px;"
        class="w-full h-full flex absolute focus:outline-none border-none
      outline-none justify-center items-center"
      >
        <div
          use:clickOutside={{ useCapture: true }}
          on:click-outside={() => {
            const selection =
              Object.keys($selectedProfileStore).length !== 0 ||
              Object.keys($selectedPresetStore).length !== 0;
            if ($appSettings.modal == "" && selection) {
              selectedProfileStore.set({});
              selectedPresetStore.set({});
            }
          }}
        >
          {#each $devices as device}
            <div
              in:fly={{
                x: -calculate_x(device.fly_x, device.fly_y),
                y: -calculate_y(device.fly_x, device.fly_y),
                duration: 500,
              }}
              out:fade={{ duration: 150 }}
              id="grid-device-{'dx:' + device.dx + ';dy:' + device.dy}"
              style="--device-size: {gridsize + 'px'}; top:{calculate_y(
                device.dx,
                device.dy
              ) + 'px'};left:{calculate_x(device.dx, device.dy) + 'px'};"
              class="device transition-all duration-300"
              class:fwMismatch={device.fwMismatch}
            >
              <Device
                type={device.id.substr(0, 4)}
                id={device.id}
                rotation={device.rot +
                  $appSettings.persistant.moduleRotation / 90}
              />
            </div>
          {/each}
        </div>
      </div>

      {#if $devices.length === 0 && ready && $appSettings.firmwareNotificationState === 0}
        <div
          style="top:{map_h / 2 - gridsize / 2}px; left:{map_w / 2 -
            gridsize / 2}px;"
          class="w-full h-full flex absolute focus:outline-none border-none
        outline-none justify-center items-center"
        >
          <div
            in:fade={{ delay: 2000, duration: 1000 }}
            class="flex w-full h-full items-center justify-center text-white
          flex-col"
          >
            <div
              class=" absolute top-0 left-0 p-4 bg-primary rounded shadow w-72"
            >
              <div class="text-xl py-1">Connect your module now!</div>
              <div class="py-1">
                Try refreshing Editor or check out the troubleshooting guide!
              </div>

              <div class="flex justify-between items-center">
                <button
                  on:click={refresh}
                  class="relative bg-commit mr-3 block hover:bg-commit-saturate-20
                text-white mt-3 mb-1 py-1 px-2 rounded border-commit-saturate-10
                hover:border-commit-desaturate-10 focus:outline-none"
                >
                  <div>Refresh</div>
                </button>

                <button
                  on:click={troubleshoot}
                  class="relative border block hover:bg-commit-saturate-20
                text-white mt-3 mb-1 py-1 px-2 rounded border-commit-saturate-10
                hover:border-commit-desaturate-10 focus:outline-none"
                >
                  <div>Troubleshooting</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <div class="w-full flex flex-col items-center min-h-fit mt-auto">
        <div class="w-full flex flex-row items-center min-h-fit mt-auto" />

        <CursorLog />
      </div>
    </grid-layout>
  </div>
</layout-container>

<style>
  .device {
    width: var(--device-size);
    height: var(--device-size);
    display: flex;
    position: absolute;
    justify-content: center;
    align-items: center;
  }

  .fwMismatch {
    @apply bg-red-500;
    @apply rounded-lg;
  }
</style>
