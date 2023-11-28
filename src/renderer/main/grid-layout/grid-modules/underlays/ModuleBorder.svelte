<script>
  import { createEventDispatcher } from "svelte";
  import {
    user_input,
    unsaved_changes,
  } from "../../../../runtime/runtime.store.js";

  export let device = undefined;
  export let visible = false;

  const dispatch = createEventDispatcher();

  let isChanged = false;
  $: {
    isChanged =
      typeof $unsaved_changes.find(
        (e) => e.x == device?.dx && e.y == device?.dy && e.element == 255
      ) !== "undefined";
  }

  let isSelected = false;
  $: {
    isSelected =
      device?.dx == $user_input.brc.dx && device?.dy == $user_input.brc.dy;
  }

  let isSystemEventsSelected = false;
  $: {
    isSystemEventsSelected =
      $user_input.brc.dx == device?.dx &&
      $user_input.brc.dy == device?.dy &&
      $user_input.event.elementnumber == 255;
  }

  function handleClick(e) {
    dispatch("click");
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if visible}
  <div
    class="{$$props.class} border-2 border-transparent"
    class:border-white={isSelected}
    class:border-opacity-30={isSelected}
    class:animate-border-error={device?.fwMismatch}
    style={$$props.style}
    on:click={handleClick}
  />
{/if}

<style>
  .animate-border-error {
    animation-name: error-animation;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-direction: alternate-reverse;
    animation-timing-function: ease;
  }

  @keyframes error-animation {
    to {
      border-color: #dc2626;
    }
  }

  .active-systemelement {
    box-shadow: inset 0 0 10px #dddddd60;
  }
</style>
