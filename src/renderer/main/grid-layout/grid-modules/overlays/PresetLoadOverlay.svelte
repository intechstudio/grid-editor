<script>
  import { ConfigTarget } from "./../../../panels/configuration/Configuration.store.js";
  import { user_input } from "./../../../../runtime/runtime.store.js";
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import { scale } from "svelte/transition";
  import { elasticOut } from "svelte/easing";
  import Button from "../elements/Button.svelte";

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
        ]?.type;
    } else {
      type = device?.pages[0].control_elements[elementNumber]?.type;
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

  let isChanged = false;

  $: handleDeviceChange(device);

  function handleDeviceChange(obj) {
    const { dx, dy } = obj;
    const ui = get(user_input);

    const target = new ConfigTarget({
      device: { dx: dx, dy: dy },
      page: ui.pagenumber,
      element: elementNumber,
      eventType: 0,
    });

    if (typeof target === "undefined") {
      isChanged = false;
      return;
    }

    const events = target.events;
    //Find the event that has change
    const changed = events.find(
      (e) => typeof e.stored !== "undefined" && e.stored !== e.config
    );
    isChanged = typeof changed !== "undefined";
  }
</script>

<container bind:this={container} on:preset-load={handlePresetLoad}>
  {#if visible}
    {#if $selectedConfigStore?.type === type}
      <div
        class="w-full h-full"
        class:loaded-element={loaded && !isChanged}
        class:element={!loaded && !isChanged}
        class:corner-cut-r={isRightCut}
        class:corner-cut-l={isLeftCut}
        disabled={loaded}
        style="{elementNumber == 255
          ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
          : 'border-radius: var(--grid-rounding);'} "
      >
        <div
          class="flex w-full h-full items-center justify-center"
          style="transform: rotate({-$appSettings.persistent.moduleRotation +
            device?.rot * 90}deg);"
        >
          {#if !loaded}
            <button
              on:click={handleClick}
              class="rounded pointer-events-auto icon bg-opacity-75 p-1"
              class:icon-corner-cut-r={isRightCut}
              class:icon-corner-cut-l={isLeftCut}
              class:scale-50={elementNumber == 255}
            >
              <SvgIcon
                class="text-white"
                iconPath={loaded ? "tick" : "download"}
                displayMode={"static"}
              />
            </button>
          {/if}
        </div>
      </div>
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
    --preset-load-color: rgb(28, 138, 114);
    --preset-load-hover-color: rgba(11, 164, 132, 1);
    --preset-load-success-color: rgba(50, 50, 50, 1);
    --preset-disabled-color: rgba(0, 0, 0, 0.1);
  }

  .element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--preset-disabled-color);
  }

  .icon {
    position: relative;
    overflow: hidden;
    background-color: var(--preset-load-color);
  }
  .icon:hover {
    position: relative;
    overflow: hidden;
    background-color: var(--preset-load-hover-color);
  }

  .disabled-element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .disabled-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--preset-disabled-color);
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
