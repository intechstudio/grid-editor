<script lang="ts">
  // Untoggled zone block: only the block's name.
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="flex items-center flex-row w-full pr-2" on:click={handleClick}>
  <div
    class="grid grid-cols-[auto_1fr_auto] gap-2 pl-2 items-center justify-center h-full w-full py-1"
  >
    <slot name="name" />
    <div></div>
    <slot name="edit-name-trigger" />
  </div>
</div>
