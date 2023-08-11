<script>
  import { fade } from "svelte/transition";
  import { tooltip_content } from "./tooltip-content.json.js";
  import Popover from "svelte-easy-popover";
  import { Analytics } from "../../../runtime/analytics.js"; //TODO: Make tracking later
  import { createEventDispatcher } from "svelte";
  import { Behaviour, Button } from "../../enums";

  const dispatch = createEventDispatcher();

  export let key = "";
  export let placement = "top";
  export let instant = false;
  export let nowrap = false;
  export let buttons = [];
  export let behaviour = Behaviour.HOVER;

  let tooltip_text = tooltip_content[key];
  let parent_element = undefined;
  let isOpen = false;

  function handleMouseEnter(e) {
    switch (behaviour) {
      case Behaviour.HOVER: {
        isOpen = true;
        break;
      }
      case Behaviour.CLICK: {
        break;
      }
      default:
        console.error("Tooltip: Unknown behaviour.");
    }
    dispatch("mouse-enter");
  }

  function handleMouseLeave(e) {
    switch (behaviour) {
      case Behaviour.HOVER: {
        isOpen = false;
        break;
      }
      case Behaviour.CLICK: {
        break;
      }
      default:
        console.error("Tooltip: Unknown behaviour.");
    }
    dispatch("mouse-leave");
  }

  function handleClick(e) {
    switch (behaviour) {
      case Behaviour.HOVER: {
        isOpen = false;
        break;
      }
      case Behaviour.CLICK: {
        isOpen = true;
        break;
      }
      default:
        console.error("Tooltip: Unknown behaviour.");
    }
    dispatch("click");
  }

  function handleCancel(e) {
    isOpen = false;
    dispatch("cancer");
  }

  function handleConfirm(e) {
    isOpen = false;
    dispatch("confirm");
  }

  let arrow;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={parent_element}
  class="w-full flex h-full absolute right-0 top-0"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleClick}
>
  <slot />

  <Popover
    triggerEvents={["hover"]}
    referenceElement={parent_element}
    remainOpenOnPopoverHover={false}
    popperOptions={{
      modifiers: [
        {
          name: "arrow",
          options: {
            element: arrow,
          },
        },
      ],
    }}
    bind:isOpen
    {placement}
    spaceAway={10}
  >
    <div
      id="tooltip"
      data-placement={placement}
      class="{$$props.class} tooltip-bg cursor-default flex flex-col relative z-50 rounded-md"
      in:fade={{
        duration: instant ? 100 : 250,
        delay: instant ? 0 : 750,
      }}
      out:fade={{
        duration: 100,
        delay: 0,
      }}
    >
      <div class="flex flex-col" class:gap-2={buttons.length > 0}>
        <div
          class="text-white text-left font-normal"
          class:whitespace-nowrap={nowrap}
        >
          {tooltip_text}
        </div>

        <div class="flex flex-row gap-2">
          {#if buttons.includes(Button.CANCEL)}
            <button
              class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20"
              on:click|stopPropagation={handleCancel}>Cancel</button
            >
          {/if}

          {#if buttons.includes(Button.CONFIRM)}
            <button
              class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20"
              on:click|stopPropagation={handleConfirm}>Confirm</button
            >
          {/if}
        </div>
      </div>
      <!-- <div class="bg-red-300" bind:this={arrow} data-popper-arrow /> -->
    </div>
  </Popover>
</div>

<style>
  :root {
    --tooltip-bg-color: rgba(14, 20, 24, 1);
  }

  .tooltip-bg {
    background-color: var(--tooltip-bg-color);
  }

  /* #arrow,
  #arrow::before {
    position: absolute;
    width: 10px;
    height: 10px;
  } */

  /* #tooltip[data-placement^="top"] > #arrow {
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
  } */
</style>
