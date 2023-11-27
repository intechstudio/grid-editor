<script>
  import { user_input } from "../../../../runtime/runtime.store.js";
  import {
    selectedConfigStore,
    isActionButtonClickedStore,
  } from "../../../../runtime/config-helper.store";
  import { createEventDispatcher } from "svelte";

  export let elementNumber;
  export let device;
  export let visible = false;

  const dispatch = createEventDispatcher();

  let [dx, dy] = [undefined, undefined];

  $: {
    dx = device?.dx;
    dy = device?.dy;
  }

  let selectedElement;
  $: {
    if (!$isActionButtonClickedStore) {
      if (Object.keys($selectedConfigStore).length !== 0) {
        selectedElement = { id: "", brc: {}, event: {} };
      } else {
        selectedElement = $user_input;
      }
    }
  }

  let isSelected = false;
  $: {
    isSelected =
      dx == selectedElement?.brc.dx &&
      dy == selectedElement?.brc.dy &&
      selectedElement?.event.elementnumber == elementNumber;
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if visible}
  <div
    class="{isSelected
      ? 'bg-white bg-opacity-10'
      : 'bg-transparent hover:bg-white hover:bg-opacity-5'} {$$props.class}"
    style={$$props.style}
    on:click={() => {
      dispatch("click", {
        elementNumber: elementNumber,
      });
    }}
  >
    <slot />
  </div>
{/if}
