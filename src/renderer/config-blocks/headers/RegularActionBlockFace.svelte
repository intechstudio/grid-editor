<script>
  import { createEventDispatcher } from "svelte";
  import { config_drag } from "../../main/_actions/move.action";
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
  class="{$$props.class} text-white flex items-center"
  class:group-hover:bg-select-saturate-10={typeof $config_drag === "undefined"}
  on:click={handleClick}
>
  <span>{config.information.blockTitle}</span>
</div>
