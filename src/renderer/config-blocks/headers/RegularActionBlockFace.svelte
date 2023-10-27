<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let access_tree;
  export let config = undefined;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="{$$props.class} text-white flex items-center px-2"
  on:click={handleClick}
>
  <span>{config.information.blockTitle}</span>
</div>
