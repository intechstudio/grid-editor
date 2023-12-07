<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { createEventDispatcher } from "svelte";
  import { appSettings } from "../../../../runtime/app-helper.store";

  export let device = undefined;
  export let visible = false;
  export let elementNumber = undefined;
  export let isRightCut = undefined;
  export let isLeftCut = undefined;

  const dispatch = createEventDispatcher();

  let type = undefined;
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
    dispatch("click", { elementNumber: elementNumber });
  }
</script>

{#if visible}
  {#if $selectedConfigStore.type === type}
    <button
      on:click={handleClick}
      class="element pointer-events-auto"
      class:corner-cut-r={isRightCut}
      class:corner-cut-l={isLeftCut}
      style="{elementNumber == 255
        ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
        : 'border-radius: var(--grid-rounding);'} "
      ><div
        style="transform: rotate({-$appSettings.persistent.moduleRotation +
          device?.rot * 90}deg);"
      >
        Load
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

<style>
  .element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(11, 164, 132, 0.7);
  }

  .disabled-element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .disabled-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(0, 0, 0, 0.3);
  }
  .element:hover:before {
    content: "";
    position: absolute;
    z-index: -1;
    box-shadow: 0px 300px 0px 1000px rgba(11, 164, 132, 0.9);
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
