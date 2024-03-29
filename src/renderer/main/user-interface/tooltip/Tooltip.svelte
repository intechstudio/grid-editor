<script>
  import { fade, slide } from "svelte/transition";
  import Popover from "svelte-easy-popover";
  import { Analytics } from "../../../runtime/analytics.js"; //TODO: Make tracking later
  import { onDestroy } from "svelte";
  import MoltenPushButton, {
    ButtonSnap,
  } from "../../panels/preferences/MoltenPushButton.svelte";

  export let text = "";
  export let placement = "top";
  export let duration = 250;
  export let delay = 750;
  export let instant = false;
  export let nowrap = false;
  export let buttons = [];
  export let triggerEvents = ["hover"];
  export let referenceElement = undefined;
  export let component = undefined;

  let showbuttons = false;
  let showTooltip;

  let closeTimeout;
  let openTimeout;

  function handleClick(e) {
    //handleReferenceElementClick(e);
    e.stopPropagation();
  }

  function handleMouseEnter(e) {
    handleReferenceElementMouseEnter(e);
    e.stopPropagation();
  }

  function handleMouseLeave(e) {
    handleReferenceElementMouseLeave(e);
    e.stopPropagation();
  }

  function handleReferenceElementClick(e) {
    if (triggerEvents.includes("click")) {
      showTooltip = true;
      showbuttons = true;
    }
    if (triggerEvents.includes("show-buttons")) {
      if (!showbuttons) {
        clearTimeout(openTimeout);
        showTooltip = true;
        showbuttons = true;
      }
    }
    if (triggerEvents.includes("hover") && !showbuttons) {
      showTooltip = false;
    }
    e.stopPropagation();
  }

  function handleReferenceElementMouseEnter(e) {
    if (triggerEvents.includes("hover")) {
      clearTimeout(closeTimeout);
      if (instant) {
        showTooltip = true;
      } else {
        openTimeout = setTimeout(() => {
          showTooltip = true;
        }, delay);
      }
    }
    if (triggerEvents.includes("click")) {
      clearTimeout(closeTimeout);
    }
    e.stopPropagation();
  }

  function handleReferenceElementMouseLeave(e) {
    if (triggerEvents.includes("hover") && !showbuttons) {
      clearTimeout(openTimeout);
      closeTimeout = setTimeout(
        () => {
          showTooltip = false;
        },
        instant ? 0 : 100
      );
    }
    if (triggerEvents.includes("click")) {
      closeTimeout = setTimeout(() => {
        showTooltip = false;
      }, 100);
    }
    e.stopPropagation();
  }

  $: handleEventListeners(referenceElement);

  let elementBuffer = undefined;
  function handleEventListeners(element) {
    if (typeof elementBuffer !== "undefined") {
      elementBuffer.removeEventListener(
        "mouseenter",
        handleReferenceElementMouseEnter
      );
      elementBuffer.removeEventListener(
        "mouseleave",
        handleReferenceElementMouseLeave
      );
      elementBuffer.removeEventListener("click", handleReferenceElementClick);
    }
    if (typeof element !== "undefined") {
      element.addEventListener("mouseenter", handleReferenceElementMouseEnter);
      element.addEventListener("mouseleave", handleReferenceElementMouseLeave);
      element.addEventListener("click", handleReferenceElementClick);
    }
    elementBuffer = element;
  }

  onDestroy(() => {
    if (typeof referenceElement !== "undefined") {
      referenceElement.removeEventListener(
        "mouseenter",
        handleReferenceElementMouseEnter
      );
      referenceElement.removeEventListener(
        "mouseleave",
        handleReferenceElementMouseLeave
      );
      referenceElement.removeEventListener(
        "click",
        handleReferenceElementClick
      );
    }
  });

  function interceptEvent(e) {
    const { type, data } = e.detail;
    switch (type) {
      case "close": {
        close();
        break;
      }
      default:
        forwardEvent(e);
    }
    e.stopPropagation();
  }

  function forwardEvent(e) {
    const { type, data } = e.detail;
    referenceElement.dispatchEvent(
      new CustomEvent(type, {
        detail: data,
      })
    );
  }

  function close() {
    clearTimeout(openTimeout);
    clearTimeout(closeTimeout);
    showTooltip = false;
    showbuttons = false;
  }
</script>

<Popover
  bind:isOpen={showTooltip}
  triggerEvents={["manual"]}
  {referenceElement}
  bind:placement
  spaceAway={10}
>
  <button
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:click={handleClick}
    class="{$$props.class} tooltip-bg cursor-default flex flex-col relative rounded-md z-[99]"
    transition:fade|global={{
      duration: instant ? 0 : duration, //Make it instant when explicitly clicked
    }}
  >
    <div class="flex flex-col w-full h-full" class:gap-2={buttons.length > 0}>
      {#if typeof component === "undefined"}
        <div
          class="text-white text-left font-normal"
          class:whitespace-nowrap={nowrap}
        >
          {text}
        </div>
      {:else}
        <svelte:component
          this={component.object}
          {...component.props}
          class="z-10"
          on:event={interceptEvent}
        />
      {/if}

      {#if showbuttons}
        <div
          transition:slide|global={{ duration: instant ? 0 : 100 }}
          class="gap-2 flex flex-row w-full"
        >
          {#each buttons as button}
            <MoltenPushButton
              text={button.label}
              snap={ButtonSnap.FULL}
              on:click={() => {
                if (typeof button.handler !== "undefined") {
                  button.handler();
                }
                close();
              }}
            />
          {/each}
        </div>
      {/if}
    </div>
  </button>
  <div
    transition:fade|global={{
      duration: instant ? 0 : duration,
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
    --tooltip-bg-color: rgba(14, 20, 24, 0.8);
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
