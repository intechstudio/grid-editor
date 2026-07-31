<script lang="ts">
  import { appSettings } from "./../../runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";
  import { SvgIcon } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  export let selected: boolean = false;
  export let iconPath: string = "";
  export let disabled: boolean = false;
  export let color: string = "#FFF";

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
  <SvgIcon {iconPath} />
</button>

<style>
  .toolbar-button {
    border-radius: 0.25rem;
    border-color: transparent;
    border-width: 1px;
    fill: var(--foreground);
  }

  .toolbar-button-disabled {
    fill: var(--foreground-disabled);
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
