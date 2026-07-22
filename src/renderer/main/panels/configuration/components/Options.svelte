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
  style="border-radius: var(--radius);"
  class="{disabled
    ? 'border-foreground-disabled'
    : 'border-foreground'}  flex w-6 h-6 items-center justify-center border transition-opacity fill-foreground"
  class:border-opacity-80={selected}
  class:bg-background-muted={selected}
  class:border-opacity-30={!selected}
  class:hover:border-opacity-100={!selected && !disabled}
  style:background={disabled ? 'var(--foreground-disabled)' : undefined}
  class:bg-opacity-10={disabled}
  {disabled}
>
  {#if selected}
    <span class="text-xl font-bold" style="color: var(--foreground-muted)"
      >&#9632;</span
    >
  {:else if halfSelected}
    <!-- TODO: Make half selected with proper SVG icon -->
    <div></div>
  {/if}
</button>
