<script>
  import { runtime, user_input } from "../../../../runtime/runtime.store.js";
  import { createEventDispatcher } from "svelte";

  export let elementNumber;
  export let device;
  export let margin = 4;
  export let visible = false;

  const dispatch = createEventDispatcher();

  let [dx, dy] = [device?.dx, device?.dy];

  let isChanged = false;
  $: {
    const events = $runtime
      .find((e) => e.dx == dx && e.dy == dy)
      .pages[$user_input.event.pagenumber].control_elements.find(
        (e) => e.controlElementNumber == elementNumber
      ).events;
    isChanged =
      typeof events.find(
        (e) => typeof e.stored !== "undefined" && e.stored !== e.config
      ) !== "undefined";
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if visible}
  <div
    class="absolute {isChanged ? $$props.class : 'bg-transparent'}"
    style={$$props.style}
    on:click={() => {
      dispatch("click", {
        elementNumber: elementNumber,
      });
    }}
  />
{/if}
