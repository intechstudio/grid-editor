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
  export let id: string | undefined = undefined;
  export let ariaLabel: string | undefined = undefined;
  export let stopPropagation: boolean = false;
  export let href: string | undefined = undefined;
  export let target: string | undefined = undefined;
  export let rel: string | undefined = undefined;
  export let tooltipDelay: number | undefined = undefined;
  export let tooltipDuration: number | undefined = undefined;

  function handleClick(e: MouseEvent) {
    if (stopPropagation) e.stopPropagation();
    dispatch("click");
    onClick?.();
  }

  function handleMouseDown(e: MouseEvent) {
    onMouseDown?.(e);
  }
</script>

<svelte:element
  this={href ? "a" : "button"}
  {id}
  {href}
  target={href ? target : undefined}
  rel={href ? rel : undefined}
  aria-label={ariaLabel}
  on:click={handleClick}
  on:mousedown={handleMouseDown}
  disabled={href ? undefined : disabled}
  use:tooltip={tooltipText
    ? { text: tooltipText, delay: tooltipDelay, duration: tooltipDuration }
    : undefined}
  class="flex items-center justify-center rounded cursor-pointer pointer-events-auto
    hover:bg-background-muted
    disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent
    {compact ? 'p-1.5' : 'p-2'}"
>
  <SvgIcon {iconPath} {iconData} fill="var(--foreground)" />
</svelte:element>
