<script>
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let selected = false;
  export let halfSelected = false;
  export let disabled = false;
  export let index = undefined;

  function handleClick(e) {
    if (disabled) {
      return;
    }
    selected = !selected;
    dispatch("selection-change", {
      value: selected,
      index: index,
    });
  }
</script>

<button
  on:click={handleClick}
  class="{disabled
    ? 'border-error'
    : 'border-white'}  flex w-6 h-6 items-center justify-center border transition-opacity rounded-md fill-white"
  class:border-opacity-80={selected}
  class:bg-secondary={selected}
  class:border-opacity-30={!selected}
  class:hover:border-opacity-100={!selected && !disabled}
  class:cursor-default={disabled}
  class:bg-error={disabled}
  class:bg-opacity-10={disabled}
>
  {#if selected}
    <SvgIcon iconPath={"tick"} />
  {:else if halfSelected}
    <!-- TODO: Make half selected with proper SVG icon -->
    <div />
  {/if}
</button>
