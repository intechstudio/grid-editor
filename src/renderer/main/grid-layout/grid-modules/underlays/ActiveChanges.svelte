<script>
  import { unsaved_changes } from "../../../../runtime/runtime.store.js";
  import { createEventDispatcher } from "svelte";

  export let elementNumber;
  export let device;
  export let style =
    "bg-unsavedchange border border-unsavedchange bg-opacity-10";
  export let margin = 4;

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
<underlay
  class=" absolute rounded-lg {isChanged ? style : 'bg-transparent'}"
  style="width: calc(100% - {margin * 2}px); height: calc(100% - {margin *
    2}px); margin: {margin}px"
  on:click={() => {
    dispatch("click", {
      elementNumber: elementNumber,
    });
  }}
/>
