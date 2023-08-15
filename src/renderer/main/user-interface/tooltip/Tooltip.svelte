<script>
  import { fade, slide } from "svelte/transition";
  import { tooltip_content } from "./tooltip-content.json.js";
  import Popover from "svelte-easy-popover";
  import { Analytics } from "../../../runtime/analytics.js"; //TODO: Make tracking later
  import { createEventDispatcher, onMount } from "svelte";
  import { expoIn } from "svelte/easing";

  const dispatch = createEventDispatcher();

  export let key = "";
  export let placement = "top";
  export let instant = false;
  export let nowrap = false;
  export let buttons = [];
  export let triggerEvents = ["hover"];

  let tooltip_text = tooltip_content[key];
  let parent_element = undefined;
  let showbuttons = false;
  let isOpen;
  let closeTimeout;

  function handleParentClick(e) {
    if (triggerEvents.includes("click")) {
      if (!showbuttons) {
        showbuttons = true;
      }
    } else {
      isOpen = false;
    }
  }

  function handleMouseEnter(e) {
    if (triggerEvents.includes("hover")) {
      isOpen = true;
      clearTimeout(closeTimeout);
    }
  }

  function handleMouseLeave(e) {
    if (triggerEvents.includes("hover") && !showbuttons) {
      closeTimeout = setTimeout(() => {
        isOpen = false;
      }, 100);
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={parent_element}
  class="w-full flex h-full absolute right-0 top-0"
  on:click={handleParentClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <slot />
</div>

<Popover
  bind:isOpen
  id="tooltip"
  referenceElement={parent_element}
  bind:placement
  spaceAway={10}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="{$$props.class} tooltip-bg cursor-default flex flex-col relative z-50 rounded-md"
    in:fade={{
      duration: instant ? 50 : 125,
      delay: instant ? 0 : 750,
      easing: expoIn,
    }}
    out:fade={{
      duration: 100,
      delay: 0,
    }}
    on:click={handleParentClick}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
  >
    <div class="flex flex-col" class:gap-2={buttons.length > 0}>
      <div
        class="text-white text-left font-normal"
        class:whitespace-nowrap={nowrap}
      >
        {tooltip_text}
      </div>

      {#if showbuttons}
        <div class="flex flex-row gap-2">
          {#each buttons as button}
            <button
              class="w-1/2 px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20"
              on:click|stopPropagation={() => {
                if (typeof button.handler !== "undefined") {
                  button.handler();
                }
                isOpen = false;
                showbuttons = false;
              }}>{button.label}</button
            >
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <div
    in:fade={{
      duration: instant ? 50 : 125,
      delay: instant ? 0 : 750,
      easing: expoIn,
    }}
    out:fade={{
      duration: 100,
      delay: 0,
    }}
    class="absolute"
    id="arrow"
    data-popper-arrow
  >
    <div class="absolute" id="arrow_face" />
  </div>
</Popover>

<style global>
  :root {
    --tooltip-bg-color: rgba(14, 20, 24, 0.7);
  }

  .tooltip-bg {
    background-color: var(--tooltip-bg-color);
  }

  .svelte-easy-popover[data-popper-placement^="top"] > #arrow {
    bottom: 0px;
  }

  .svelte-easy-popover[data-popper-placement^="top"] > #arrow > #arrow_face {
    transform: translateX(-10px);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;

    border-top: 10px solid var(--tooltip-bg-color);
  }

  .svelte-easy-popover[data-popper-placement^="bottom"] > #arrow {
    top: -10px;
  }

  .svelte-easy-popover[data-popper-placement^="bottom"] > #arrow > #arrow_face {
    transform: translateX(-10px);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;

    border-bottom: 10px solid var(--tooltip-bg-color);
  }

  .svelte-easy-popover[data-popper-placement^="left"] > #arrow {
    right: 0px;
  }

  .svelte-easy-popover[data-popper-placement^="left"] > #arrow > #arrow_face {
    transform: translateY(-10px);
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;

    border-left: 10px solid var(--tooltip-bg-color);
  }

  .svelte-easy-popover[data-popper-placement^="right"] > #arrow {
    left: -9px;
  }

  .svelte-easy-popover[data-popper-placement^="right"] > #arrow > #arrow_face {
    transform: translateY(-10px);
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;

    border-right: 10px solid var(--tooltip-bg-color);
  }
</style>
