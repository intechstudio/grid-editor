<script>
  import { user_input } from "../../../../runtime/runtime.store.js";
  import { get } from "svelte/store";
  import { createEventDispatcher } from "svelte";

  export let elementNumber;
  export let isLeftCut;
  export let isRightCut;
  export let device;
  export let visible = false;

  const dispatch = createEventDispatcher();

  let [dx, dy] = [undefined, undefined];

  $: {
    dx = device?.dx;
    dy = device?.dy;
  }

  let isSelected = false;
  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui) {
    isSelected =
      dx == ui?.dx && dy == ui?.dy && ui?.elementnumber == elementNumber;
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if visible}
  <div
    class="pointer-events-auto {isSelected
      ? 'selected-element'
      : 'selectable-element'} {$$props.class} 
      element
      {isRightCut ? 'corner-cut-r' : ''}
      {isLeftCut ? 'corner-cut-l' : ''}
      "
    style="   {elementNumber == 255
      ? 'border-top-left-radius: 9999px; border-top-right-radius: 9999px;'
      : 'border-radius: var(--grid-rounding);'}   "
    on:click={() => {
      dispatch("click", {
        elementNumber: elementNumber,
      });
    }}
  />
{/if}

<style>
  div.element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  div.selected-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(255, 255, 255, 0.2);
  }
  div.selectable-element:hover:before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(255, 255, 255, 0.1);
  }

  div.corner-cut-l:before {
    position: absolute;
    bottom: -35px;
    left: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
  div.corner-cut-r:before {
    position: absolute;
    bottom: -35px;
    right: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
</style>
