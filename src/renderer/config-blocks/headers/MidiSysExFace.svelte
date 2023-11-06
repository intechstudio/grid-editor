<script>
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";

  const dispatch = createEventDispatcher();

  export let access_tree;
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
  class="{$$props.class} text-white flex items-center flex-row w-full px-2"
  on:click={handleClick}
>
  <div class="grid grid-cols-[auto_1fr] items-center h-full w-full">
    <div class="mr-2 w-fit whitespace-nowrap">
      <span>{config.information.blockTitle}</span>
    </div>
    <div class="bg-primary p-1 my-auto rounded truncate">
      <span class=" whitespace-nowrap">
        {whatsInParenthesis.exec(config.script)}
      </span>
    </div>
  </div>
</div>
