<script>
  import { unsaved_changes } from "../../../../runtime/runtime.store.js";
  import { createEventDispatcher } from "svelte";

  export let elementNumber;
  export let device;
  export let margin = 4;
  export let visible = false;

  const dispatch = createEventDispatcher();

  let [dx, dy] = [device?.dx, device?.dy];

  let isChanged = false;
  $: {
    isChanged =
      typeof $unsaved_changes.find(
        (e) => e.x == dx && e.y == dy && e.element == elementNumber
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
