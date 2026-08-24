<script lang="ts">
  import { tooltip } from "../_actions/tooltip.ts";
  import CircularBar from "./CircularBar.svelte";

  import menuIcons from "$lib/menu.icons";

  export let menuIcon;
  export let menuIconPath;
  export let installProgress;
  export let tooltipKey;
  export let tooltipText;
  export let selectedLeftTab;
  export let tabName;
  export let leftSize;
  export let clickHandler;
  export let disabled = false;
  function handleClick(e) {}
</script>

<button
  {disabled}
  data-testid={"nav-" + tabName}
  use:tooltip={{
    nowrap: true,
    placement: "right",
    delay: 100,
    class: "px-2 py-1",
    key: tooltipKey,
    text: tooltipText,
    triggerEvents: ["focus", "click", "hover"],
  }}
  on:click={() => {
    clickHandler(tabName);
  }}
  class="relative cursor-pointer m-1 my-2 p-1 w-14 h-14 flex justify-center items-center group hover:bg-opacity-100 rounded-lg {selectedLeftTab ==
    tabName && leftSize != 0
    ? 'selected '
    : 'bg-opacity-40 '} tabButtonElement activator-button"
>
  <div class="tabButtonIcon">
    {#if menuIcon}
      {@html menuIcons[menuIcon]}
    {:else if menuIconPath}
      <img style="opacity: 0.8;" src={menuIconPath} alt={tabName} />
    {:else}
      {@html menuIcons["menu_package_general"]}
    {/if}
  </div>

  {#if installProgress !== undefined}
    <div
      class="left-0 top-0 w-full h-full p-1 absolute flex items-center content-center"
      style="background-color: #1e262870;"
    >
      <CircularBar value={installProgress * 100} color="#fff" thickness="10%" />
    </div>
  {/if}

  <div
    class="left-0 -ml-3 absolute transition-all {selectedLeftTab == tabName &&
    leftSize != 0
      ? 'h-8'
      : 'h-2 group-hover:h-4'} w-2 rounded-full bg-white"
  ></div>
</button>

<style>
  .tabButtonIcon {
    width: 100%;
    height: 100%;
    padding: 0.375rem; /* or 6px */
  }

  .tabButtonElement {
    background-color: var(--background-muted);
    color: var(--foreground-muted);
    fill: var(--foreground-muted);
  }

  .tabButtonElement:hover {
    background-color: var(--background);
    color: var(--foreground);
    fill: var(--foreground);
  }

  .tabButtonElement.selected {
    background-color: var(--background);
    color: var(--foreground);
    fill: var(--foreground);
  }
</style>
