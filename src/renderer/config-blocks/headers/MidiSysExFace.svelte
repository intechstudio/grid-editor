<script>
  import { createEventDispatcher } from "svelte";
  import { config_drag } from "../../main/_actions/move.action";

  const dispatch = createEventDispatcher();

  export let config = undefined;

  const whatsInParenthesis = /\(([^)]+)\)/;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="h-full bg-secondary text-white flex items-center flex-row w-full px-2 {typeof $config_drag ===
  'undefined'
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
        {whatsInParenthesis.exec(config.script)}
      </span>
    </div>
  </div>
</div>
