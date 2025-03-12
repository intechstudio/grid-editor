<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../../runtime/runtime";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  const whatsInParenthesis = /\(([^)]+)\)/;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="bg-secondary text-white flex items-center flex-row w-full px-2 {false
    ? 'group-hover/bg-color:bg-select-saturate-10'
    : ''}"
  on:click={handleClick}
>
  <div class="grid grid-cols-[auto_1fr] items-center h-full w-full my-1">
    <span class="mr-2 w-fit whitespace-nowrap"
      >{config.information.displayName}</span
    >
    <div class="bg-primary p-1 my-auto rounded truncate">
      <span class="whitespace-nowrap text-white text-opacity-60">
        {whatsInParenthesis.exec($config.script)}
      </span>
    </div>
  </div>
</div>
