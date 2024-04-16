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
  class="{$$props.class} text-white flex items-center"
  style="background-color:{config.information.color}"
  class:rounded-tr-xl={config.information.rounding == "top"}
  class:rounded-br-xl={config.information.rounding == "bottom"}
  on:click={handleClick}
>
  <span>{config.information.displayName}</span>
</div>
