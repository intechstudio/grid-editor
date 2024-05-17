<script lang="ts">
  import { scale } from "svelte/transition";
  import {
    shortcut as shortcutAction,
    ShortcutParameter,
  } from "./../_actions/shortcut.action";
  import { appSettings } from "./../../runtime/app-helper.store.js";
  import { createEventDispatcher } from "svelte";
  import SvgIcon from "./SvgIcon.svelte";

  const dispatch = createEventDispatcher();

  export let selected: boolean = false;
  export let iconPath: string = "";
  export let disabled: boolean = false;
  export let color: string = "#FFF";
  export let shortcut: ShortcutParameter | undefined = undefined;

  let buttonElement: HTMLElement;

  function handleClick(e) {
    animate();
    dispatch("click");
  }

  function handleMouseEnter(e) {
    dispatch("mouseenter");
  }

  function handleMouseLeave(e) {
    dispatch("mouseleave");
  }

  function animate() {
    buttonElement.animate([{ opacity: 0.5, scale: 0.8 }], {
      duration: 50,
      direction: "alternate",
      iterations: 2,
    });
  }
</script>

<button
  bind:this={buttonElement}
  use:shortcutAction={shortcut}
  class:selected
  on:click={handleClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  {disabled}
  class="{$appSettings.persistent.colorfulToolbar
    ? 'colorful-toolbar-button'
    : 'toolbar-button'} focus:outline-none p-1"
  class:toolbar-button-disabled={disabled &&
    !$appSettings.persistent.colorfulToolbar}
  class:colorful-toolbar-button-disabled={disabled &&
    $appSettings.persistent.colorfulToolbar}
  style="--color: {color};"
>
  <SvgIcon width={14} height={14} {iconPath} />
</button>

<style>
  .toolbar-button {
    border-radius: 0.25rem;
    border-color: transparent;
    border-width: 1px;
    fill: #fff;
  }

  .toolbar-button-disabled {
    filter: brightness(33%);
    pointer-events: none;
  }

  .toolbar-button:hover {
    border-color: var(--color);
    fill: var(--color);
  }

  .colorful-toolbar-button {
    border-radius: 0.25rem;
    border-color: transparent;
    border-width: 1px;
    fill: var(--color);
  }

  .colorful-toolbar-button-disabled {
    fill: #fff;
    filter: brightness(33%);
    pointer-events: none;
  }

  .colorful-toolbar-button:hover {
    border-color: var(--color);
    filter: brightness(166%);
  }
</style>
