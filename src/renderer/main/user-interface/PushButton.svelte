<script>
  import { setTooltip } from "./tooltip/Tooltip.js";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let tooltip = undefined;
  export let selected = false;
  export let text = "";
  export let style = "normal";

  function handleClick(e) {
    dispatch("click");
  }
</script>

<button
  use:setTooltip={tooltip}
  class:selected
  on:click={handleClick}
  class="{$$props.class} {selected
    ? 'shadow-md text-white bg-secondary-brightness-20'
    : 'hover:bg-secondary-brightness-10 text-gray-50 bg-secondary'} relative py-1 px-4 flex-grow border-0 rounded focus:outline-none"
>
  <span>{text}</span>
</button>
