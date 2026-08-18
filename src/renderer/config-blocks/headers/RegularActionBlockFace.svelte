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
<div
  role="button"
  tabindex="0"
  class="justify-between gap-2 w-full px-2 py-1 flex-row flex items-center overflow-hidden pointer-events-none"
  on:click={handleClick}
>
  <slot name="name" />

  <slot name="edit-name-trigger" />
</div>
