<script>
  import { runtime, user_input } from "./../../../../runtime/runtime.store.js";
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { createEventDispatcher } from "svelte";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import { scale } from "svelte/transition";
  import { elasticOut } from "svelte/easing";

  export let device = undefined;
  export let visible = false;
  export let elementNumber = undefined;
  export let isRightCut = undefined;
  export let isLeftCut = undefined;

  const dispatch = createEventDispatcher();

  let type = undefined;
  let loaded = false;
  let container;

  $: {
    if (elementNumber === 255) {
      type =
        device?.pages[0].control_elements[
          device?.pages[0].control_elements.length - 1
        ]?.controlElementType;
    } else {
      type =
        device?.pages[0].control_elements[elementNumber]?.controlElementType;
    }
  }

  function handleClick(e) {
    dispatch("click", {
      sender: container,
      elementNumber: elementNumber,
    });
  }

  $: {
    if ($selectedConfigStore) {
      loaded = false;
    }
  }

  function handlePresetLoad(e) {
    const { success } = e.detail;
    loaded = success;
  }

  let [dx, dy] = [device?.dx, device?.dy];
  let isChanged = false;
  $: {
    try {
      const events = $runtime
        .find((e) => e.dx == dx && e.dy == dy)
        .pages[$user_input.event.pagenumber].control_elements.find(
          (e) => e.controlElementNumber == elementNumber
        ).events;

      //Find the event that has change
      const changed = events.find(
        (e) =>
          e.cfgStatus !== "NULL" &&
          e.cfgStatus !== "ERASED" &&
          e.stored !== e.config
      );

      if (typeof changed !== "undefined") {
        isChanged = true;
      } else {
        isChanged = false;
      }
    } catch (e) {}
  }

  $: console.log(isChanged);
</script>

<container bind:this={container} on:preset-load={handlePresetLoad}>
  {#if visible}
    {#if $selectedConfigStore.type === type}
      <button
        on:click={handleClick}
        class="pointer-events-auto w-full h-full"
        class:loaded-element={loaded && !isChanged}
        class:element={!loaded && !isChanged}
        class:corner-cut-r={isRightCut}
        class:corner-cut-l={isLeftCut}
        disabled={loaded}
        style="{elementNumber == 255
          ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
          : 'border-radius: var(--grid-rounding);'} "
        ><div
          class="flex w-full h-full items-center justify-center"
          style="transform: rotate({-$appSettings.persistent.moduleRotation +
            device?.rot * 90}deg);"
        >
          {#key loaded || $selectedConfigStore}
            <div
              in:scale={{ duration: 1000, start: 0.5, easing: elasticOut }}
              class="rounded icon bg-opacity-75 p-1"
              class:icon-corner-cut-r={isRightCut}
              class:icon-corner-cut-l={isLeftCut}
              class:scale-50={elementNumber == 255}
            >
              {#if !loaded}
                <SvgIcon
                  class="text-white"
                  iconPath={"download"}
                  displayMode={"static"}
                />
              {:else}
                <SvgIcon
                  class="text-white"
                  iconPath={"tick"}
                  displayMode={"static"}
                />
              {/if}
            </div>
          {/key}
        </div>
      </button>
    {:else}
      <div
        class="w-full h-full"
        class:disabled-element={!isChanged}
        class:corner-cut-r={isRightCut}
        class:corner-cut-l={isLeftCut}
        style="{elementNumber == 255
          ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
          : 'border-radius: var(--grid-rounding);'} "
      />
    {/if}
  {/if}
</container>

<style>
  :root {
    --load-color: rgba(11, 164, 132, 0.7);
    --disabled-color: rgba(0, 0, 0, 0.3);
  }

  .element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--load-color);
  }

  .icon {
    position: relative;
    overflow: hidden;
  }

  .icon::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(0, 0, 0, 0.8);
  }

  .disabled-element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .disabled-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--disabled-color);
  }

  .icon-corner-cut-l:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    left: -35px;
    width: 46px;
    height: 46px;
    border-radius: 100%;
  }
  .icon-corner-cut-r:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    right: -35px;
    width: 46px;
    height: 46px;
    border-radius: 100%;
  }

  .corner-cut-l:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    left: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
  .corner-cut-r:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    right: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
</style>
