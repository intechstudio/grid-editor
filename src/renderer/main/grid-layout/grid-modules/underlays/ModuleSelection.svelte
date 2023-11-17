<script>
  import { createEventDispatcher } from "svelte";
  import {
    user_input,
    unsaved_changes,
  } from "../../../../runtime/runtime.store.js";

  export let moduleHovered = false;
  export let margin = 0;
  export let rounding = 0;
  export let device = undefined;

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
    console.log($user_input);
    isSystemEventsSelected =
      $user_input.brc.dx == device?.dx &&
      $user_input.brc.dy == device?.dy &&
      $user_input.event.elementnumber == 255;
  }

  function handleClick(e) {
    if (!isSystemEventsSelected) {
      dispatch("click");
    }
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="flex pointer-events-auto absolute top-0 left-0"
  style="width: calc(100% + {margin * 2}px);height: calc(100% + {margin *
    2}px); margin: -{margin}px;"
  on:mouseover|self={() => (moduleHovered = true)}
  on:mouseleave|self={() => (moduleHovered = false)}
  on:click={handleClick}
>
  <div
    class="border-2 absolute border-transparent"
    class:active-systemelement={isSystemEventsSelected}
    class:border-white={isSelected || moduleHovered}
    class:border-opacity-75={moduleHovered}
    class:border-opacity-30={isSelected}
    class:animate-border-error={device?.fwMismatch}
    style="width: calc(100% - {margin * 2}px);height: calc(100% - {margin *
      2}px); margin: {margin}px; border-radius: {rounding}px;"
  />
</div>

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
