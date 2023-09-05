<script>
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { Analytics } from "../../runtime/analytics.js";
  import Spinner from "./Spinner.svelte";
  import Thinker from "./Thinker.svelte";
  import { slide } from "svelte/transition";
  import { setTooltip } from "./tooltip/Tooltip.js";
  import { writeBuffer } from "../../runtime/engine.store.js";
  import { engine } from "../../runtime/runtime.store.js";

  let showRefresh = false;

  onMount(() => {
    setTimeout(handleHanging, 5000);
  });

  function handleHanging(e) {
    showRefresh = true;
  }

  async function debugWriteBuffer() {
    window.electron.discord.sendMessage({
      title: "Writebuffer",
      text: JSON.stringify(get(writeBuffer)).substring(0, 1000),
    });

    Analytics.track({
      event: "Writebuffer",
      payload: {
        click: "Clear",
      },
      mandatory: false,
    });

    writeBuffer.clear();
    $engine = "ENABLED";
  }
</script>

<div
  class="bg-primary rounded-md shadow-xl shadow-black w-72 p-4 {$$props.class}"
>
  {#if showRefresh || true}
    <div transition:slide={{ duration: 300 }} class="flex flex-col">
      <span class="text-xl text-white"
        >It seems like your module crashed or hanging...</span
      >
      <span class="text-white mt-4">
        Wait for your grid to process incoming data, or try reseting it!
      </span>
      {#if $writeBuffer.length > 0}
        <span class="text-white mt-2"
          >Frames waiting to transfer:
          <span class="text-orange-400 text-xl ml-1">{$writeBuffer.length}</span
          >
        </span>
      {/if}
      <button
        use:setTooltip={{
          key: "engine_clear",
          placement: "bottom",
          class: "w-60 p-4",
          buttons: [
            { label: "Yes", handler: debugWriteBuffer },
            { label: "No", handler: undefined },
          ],
          triggerEvents: ["show-buttons", "hover"],
        }}
        class=" relative flex items-center focus:outline-none justify-center
      rounded bg-select text-white py-1
        mt-5"
      >
        <span class="pr-2 text-gray-200 tracking-wider"> Reset Engine </span>
        <svg
          class="w-5 h-5 p-0.5 fill-current text-red-500"
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
      </button>

      <Thinker />
    </div>
  {:else}
    <div class="flex flex-col items-center">
      <span class="text-xl text-white">Processing Data...</span>
      <div class="scale-50 mt-3">
        <Spinner />
      </div>
    </div>
  {/if}
</div>
