<script>
  import { fade } from "svelte/transition";
  import { tooltip_content } from "./tooltip-content.json.js";
  import Popover from "svelte-easy-popover";
  import { attachment } from "../Monster.store";

  //TODO: Make tracking later
  import mixpanel from "mixpanel-browser";

  export let key = "";
  export let placement = "top";
  export let instant = false;
  export let nowrap = false;

  let tooltip_text = tooltip_content[key];
  let parent_element = undefined;
  let isOpen = false;

  function handleMouseEnter(e) {
    isOpen = true;
  }

  function handleMouseLeave(e) {
    isOpen = false;
  }

  function handleClick(e) {
    isOpen = false;
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
    class="tooltip-bg cursor-default text-base flex flex-col text-white text-left"
    class:p-4={!instant}
    class:px-2={instant}
    class:py-1={instant}
    in:fade={{
      duration: instant ? 100 : 250,
      delay: instant ? 0 : 750,
    }}
    out:fade={{
      duration: 100,
      delay: 0,
    }}
  >
    <span class:whitespace-nowrap={nowrap}> {tooltip_text}</span>
    <div id="arrow" data-popper-arrow />
  </div>
</Popover>

<style>
  :root {
    --tooltip-bg-color: rgba(14, 20, 24, 0.92);
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
    border-left: 20px solid transparent;
    border-right: 20px solid transparent;

    border-top: 20px solid var(--tooltip-bg-color);
  }

  #tooltip[data-placement^="bottom"] > #arrow {
    top: -10px;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;

    border-bottom: 5px solid var(--tooltip-bg-color);
  }

  #tooltip[data-placement^="left"] > #arrow {
    right: -10px;
    border-top: 60px solid transparent;
    border-bottom: 60px solid transparent;

    border-left: 60px solid var(--tooltip-bg-color);
  }

  #tooltip[data-placement^="right"] > #arrow {
    left: -10px;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;

    border-right: 10px solid var(--tooltip-bg-color);
  }
</style>
