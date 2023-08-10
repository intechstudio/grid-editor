<script>
  import { fade } from "svelte/transition";
  import { tooltip_content } from "./tooltip-content.json.js";
  import Popover from "svelte-easy-popover";
  import { Analytics } from "../../../runtime/analytics.js"; //TODO: Make tracking later
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let key = "";
  export let placement = "top";
  export let instant = false;
  export let nowrap = false;
  export let buttons = [];
  export const btn_confirm = "btn-confirm";
  export const btn_cancel = "btn-cancel";
  export const bhv_hover = "bhv-hover";
  export const bhv_click = "bhv-click";
  export let behaviour = bhv_click;

  let tooltip_text = tooltip_content[key];
  let parent_element = undefined;
  let isOpen = false;
  let attachmentElement;

  function handleMouseEnter(e) {
    switch (behaviour) {
      case bhv_hover: {
        isOpen = true;
        break;
      }
      case bhv_click: {
        break;
      }
      default:
        console.error("Tooltip: Unknown behaviour.");
    }
  }

  function handleMouseLeave(e) {
    switch (behaviour) {
      case bhv_hover: {
        isOpen = false;
        break;
      }
      case bhv_click: {
        break;
      }
      default:
        console.error("Tooltip: Unknown behaviour.");
    }
  }

  function handleClick(e) {
    switch (behaviour) {
      case bhv_hover: {
        isOpen = false;
        break;
      }
      case bhv_click: {
        isOpen = true;
        break;
      }
      default:
        console.error("Tooltip: Unknown behaviour.");
    }
  }

  function handleCancel(e) {
    isOpen = false;
  }

  function handleConfirm(e) {
    isOpen = false;
    dispatch("confirm");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={parent_element}
  class="w-full flex h-full absolute right-0 top-0"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleClick}
/>

<Popover
  bind:this={attachmentElement}
  triggerEvents={["hover"]}
  referenceElement={parent_element}
  remainOpenOnPopoverHover={false}
  bind:isOpen
  {placement}
  spaceAway={10}
>
  <div
    id="tooltip"
    data-placement={placement}
    class="{$$props.class} w-80 tooltip-bg cursor-default flex flex-col relative z-50"
    in:fade={{
      duration: instant ? 100 : 250,
      delay: instant ? 0 : 750,
    }}
    out:fade={{
      duration: 100,
      delay: 0,
    }}
  >
    <div
      class="text-white text-left font-normal"
      class:whitespace-nowrap={nowrap}
    >
      {tooltip_text}
    </div>
    <div class="flex flex-row gap-2 mt-2">
      {#if buttons.includes(btn_cancel)}
        <button
          class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20"
          on:click|stopPropagation={handleCancel}>Cancel</button
        >
      {/if}

      {#if buttons.includes(btn_confirm)}
        <button
          class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20"
          on:click|stopPropagation={handleConfirm}>Confirm</button
        >
      {/if}
    </div>
    <div id="arrow" data-popper-arrow />
  </div>
</Popover>

<style>
  :root {
    --tooltip-bg-color: rgba(14, 20, 24, 1);
  }

  .tooltip-bg {
    background-color: var(--tooltip-bg-color);
  }

  #arrow,
  #arrow::before {
    position: absolute;
    width: 0px;
    height: 0px;
  }

  #tooltip[data-placement^="top"] > #arrow {
    bottom: -10px;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;

    border-top: 10px solid var(--tooltip-bg-color);
  }

  #tooltip[data-placement^="bottom"] > #arrow {
    top: -10px;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;

    border-bottom: 10px solid var(--tooltip-bg-color);
  }

  #tooltip[data-placement^="left"] > #arrow {
    right: -10px;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;

    border-left: 10px solid var(--tooltip-bg-color);
  }

  #tooltip[data-placement^="right"] > #arrow {
    left: -10px;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;

    border-right: 10px solid var(--tooltip-bg-color);
  }
</style>
