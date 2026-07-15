<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../../runtime/runtime";
  const dispatch = createEventDispatcher();

  export let action: GridAction;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="px-2 w-full {action.information.rounding === 'top'
    ? 'rounded-tr-xl'
    : ''} {action.information.rounding === 'bottom'
    ? 'rounded-br-xl'
    : ''} text-white flex items-center"
  on:click={handleClick}
>
  <span>{action.information.displayName}</span>
</div>
