<script>
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
</script>

<container bind:this={container} on:preset-load={handlePresetLoad}>
  {#if visible}
    {#if $selectedConfigStore.type === type}
      <button
        on:click={handleClick}
        class="{loaded ? 'loaded-element' : 'element'} pointer-events-auto"
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
              class="border-black rounded"
              class:border={loaded && elementNumber != 255}
              class:scale-75={elementNumber == 255}
            >
              {#if !loaded}
                <SvgIcon
                  class="text-black"
                  iconPath={"download"}
                  displayMode={"static"}
                />
              {:else}
                <SvgIcon
                  class="text-black"
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
        class="w-full h-full disabled-element"
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
    --load-color: rgba(200, 200, 200, 0.4);
    --load-hover-color: rgba(61, 214, 182, 0.5);
    --disabled-color: rgba(0, 0, 0, 0.3);
    --loaded-color: rgba(11, 164, 132, 0.8);
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

  .loaded-element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .loaded-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--loaded-color);
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

  .loaded-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--loaded-color);
  }

  .element:hover:before {
    content: "";
    position: absolute;
    z-index: -1;
    box-shadow: 0px 300px 0px 1000px var(--load-hover-color);
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
