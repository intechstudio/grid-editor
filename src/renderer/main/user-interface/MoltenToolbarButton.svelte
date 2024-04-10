<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import SvgIcon from "./SvgIcon.svelte";

  const dispatch = createEventDispatcher();

  export let selected: boolean = false;
  export let iconPath: string = "";
  export let disabled: boolean = false;
  export let color: string = "#FFF";

  function handleClick(e) {
    dispatch("click");
  }

  function handleMouseEnter(e) {
    dispatch("mouseenter");
  }

  function handleMouseLeave(e) {
    dispatch("mouseleave");
  }
</script>

<container class="relative">
  <button
    class:selected
    on:click={handleClick}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    {disabled}
    class="{disabled
      ? 'toolbar-button-disabled'
      : 'toolbar-button'} focus:outline-none p-1"
    style="--color: {color};"
  >
    <SvgIcon width={14} height={14} {iconPath} />
  </button>
</container>

<style>
  .toolbar-button {
    border-radius: 0.25rem;
    border-color: transparent;
    border-width: 1px;
    fill: #fff;
    opacity: 0.75;
  }

  .toolbar-button-disabled {
    border-color: transparent;
    border-width: 1px;
    fill: #888888;
    opacity: 0.5;
  }

  .toolbar-button:hover {
    border-color: var(--color);
    fill: var(--color);
    opacity: 1;
  }
</style>
