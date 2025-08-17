<script lang="ts">
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  interface Props {
    selected?: boolean;
    halfSelected?: boolean;
    disabled?: boolean;
    testid: any;
  }

  let {
    selected = $bindable(false),
    halfSelected = false,
    disabled = false,
    testid
  }: Props = $props();

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
  onclick={handleClick}
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
    <SvgIcon iconPath={"tick"} />
  {:else if halfSelected}
    <!-- TODO: Make half selected with proper SVG icon -->
    <div></div>
  {/if}
</button>
