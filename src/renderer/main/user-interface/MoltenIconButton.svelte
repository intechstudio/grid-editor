<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { SvgIcon } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  export let iconPath: string;
</script>

<button
  on:click={() => {
    dispatch("click");
  }}
  id="molten-icon-button"
  class="p-2 cursor-pointer rounded not-draggable hover:bg-white/10"
  style="fill: var(--foreground) !important; stroke: var(--foreground) !important;"
>
  <SvgIcon {iconPath} />
</button>

<style>
  :global(#molten-icon-button svg path),
  :global(#molten-icon-button svg g path) {
    stroke: var(--foreground) !important;
  }
</style>
