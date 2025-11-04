<script>
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let selected = false;
  export let halfSelected = false;
  export let disabled = false;
  export let testid;

  function handleClick(e) {
    if (disabled) {
      return;
    }
    selected = !selected;
    dispatch("select", {
      value: selected,
    });
  }
</script>

<button
  data-testid={testid}
  on:click={handleClick}
  class="{disabled
    ? 'border-error'
    : 'border-foreground'}  flex w-6 h-6 items-center justify-center border transition-opacity rounded-md fill-foreground"
  class:border-opacity-80={selected}
  class:bg-background-muted={selected}
  class:border-opacity-30={!selected}
  class:hover:border-opacity-100={!selected && !disabled}
  class:bg-error={disabled}
  class:bg-opacity-10={disabled}
  {disabled}
>
  {#if selected}
    <span class="text-xl font-bold" style="color: var(--foreground-muted)"
      >x</span
    >
  {:else if halfSelected}
    <!-- TODO: Make half selected with proper SVG icon -->
    <div />
  {/if}
</button>
