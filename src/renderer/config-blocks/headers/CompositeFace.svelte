<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let config = undefined;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="px-2 w-full h-full {config.information.rounding === 'top'
    ? 'rounded-tr-xl'
    : ''} {config.information.rounding === 'bottom'
    ? 'rounded-br-xl'
    : ''} text-white flex items-center"
  style="background-color:{config.information.color}"
  on:click={handleClick}
>
  <span>{config.information.displayName}</span>
</div>
