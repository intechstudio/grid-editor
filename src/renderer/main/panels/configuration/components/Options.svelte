<script>
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
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

<select-box
  class="flex pl-2 justify-center items-center bg-transparent pointer-events-auto"
>
  <button
    on:click={handleClick}
    class="{disabled
      ? 'border-error'
      : 'border-white'} justify-center border transition-opacity rounded-md"
    class:border-opacity-80={selected}
    class:bg-secondary={selected}
    class:h-18px={!selected}
    class:w-18px={!selected}
    class:border-opacity-30={!selected}
    class:hover:border-opacity-100={!selected && !disabled}
    class:cursor-default={disabled}
    class:bg-error={disabled}
    class:bg-opacity-10={disabled}
  >
    {#if selected}
      <SvgIcon
        displayMode="button"
        class="h-16px w-16px"
        activeState={selected}
        iconPath={"tick"}
      />
    {:else if halfSelected}
      <!-- TODO: Make half selected with proper SVG icon -->
      <div />
    {/if}
  </button>
</select-box>
