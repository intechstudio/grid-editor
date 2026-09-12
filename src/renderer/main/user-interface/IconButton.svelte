<script lang="ts">
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { createEventDispatcher } from "svelte";
  import { tooltip } from "../_actions/tooltip";

  const dispatch = createEventDispatcher();

  export let iconPath: string = "";
  export let iconData: string | undefined = undefined;
  export let disabled: boolean = false;
  export let compact: boolean = false;
  export let tooltipText: string | undefined = undefined;
  export let onClick: (() => void) | undefined = undefined;
  export let onMouseDown: ((e: MouseEvent) => void) | undefined = undefined;

  function handleClick() {
    dispatch("click");
    onClick?.();
  }

  function handleMouseDown(e: MouseEvent) {
    onMouseDown?.(e);
  }
</script>

<button
  on:click={handleClick}
  on:mousedown={handleMouseDown}
  {disabled}
  use:tooltip={tooltipText ? { text: tooltipText } : undefined}
  class="flex items-center justify-center rounded cursor-pointer
    hover:bg-background-muted
    disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent
    {compact ? 'p-1.5' : 'p-2'}"
>
  <SvgIcon {iconPath} {iconData} fill="var(--foreground)" />
</button>
