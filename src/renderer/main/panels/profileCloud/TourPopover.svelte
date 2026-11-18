<script lang="ts" context="module">
  export namespace TourPopover {
    export interface Content {
      markdown: string;
    }
  }
</script>

<script lang="ts">
  import { fade } from "svelte/transition";
  import Popover from "svelte-easy-popover";
  import {
    MarkdownContainer,
    MoltenPushButton,
  } from "@intechstudio/grid-uikit";
  import { configTour } from "./ConfigTour";
  import { marked } from "marked";
  import { type Writable } from "svelte/store";
  import { Grid } from "../../../lib/_utils";

  export let markdown = "";
  export let referenceElement: HTMLElement;
  export let updateTrigger: Writable<number>;
  export let position: Grid.Position = Grid.Position.LEFT;

  let popperInstance: any = undefined;

  // Reposition on target size changes instead of re-mounting the popover,
  // which would replay its fade-in transition.
  $: if ($updateTrigger >= 0) popperInstance?.update();

  $: isLastStep = !$configTour || typeof $configTour.next() === "undefined";

  function handleClose() {
    configTour.clear();
  }

  function handleNextClicked() {
    configTour.stepForward();
  }

  function handlePreviousClicked() {
    configTour.stepBackward();
  }
</script>

<Popover
  isOpen={true}
  {referenceElement}
  placement={position}
  spaceAway={10}
  bind:popperInstance
>
  <div
    class="p-2 rounded bg-popover-background text-foreground flex flex-col border gap-1 border-foreground-soft"
    transition:fade|global={{
      duration: 250,
    }}
  >
    <div class="text-foreground mb-2">
      <MarkdownContainer markdown={String(marked(markdown))} />
    </div>
    <div class="flex flex-row gap-2 items-center justify-between">
      <MoltenPushButton
        text={"Quit Tour"}
        snap={"auto"}
        style={isLastStep ? "accept" : "normal"}
        click={handleClose}
      />
      <div class="flex flex-row gap-2">
        <MoltenPushButton
          text={"Previous"}
          snap={"auto"}
          style={"normal"}
          disabled={!$configTour ||
            typeof $configTour.previous() === "undefined"}
          click={handlePreviousClicked}
        />

        <MoltenPushButton
          text={"Next"}
          snap={"auto"}
          style={isLastStep ? "normal" : "accept"}
          disabled={isLastStep}
          click={handleNextClicked}
        />
      </div>
    </div>
  </div>
  <div
    transition:fade|global={{
      duration: 250,
    }}
    class="tooltip-absolute"
    id="arrow"
    data-popper-arrow
  >
    <div class="tooltip-absolute" id="arrow_face"></div>
  </div>
</Popover>

<style global>
  .svelte-easy-popover .tooltip-absolute {
    position: absolute;
  }

  /* The arrow face is a triangle in the border color; ::after is the same
     triangle in the fill color, shifted 1px toward the popover so the
     border wraps around the arrow's slanted edges. */
  .svelte-easy-popover #arrow_face::after {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border: 10px solid transparent;
  }

  .svelte-easy-popover[data-popper-placement^="top"] > #arrow {
    bottom: 0px;
  }

  .svelte-easy-popover[data-popper-placement^="top"] > #arrow > #arrow_face {
    transform: translateX(-10px);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid var(--foreground-soft);
  }

  .svelte-easy-popover[data-popper-placement^="top"]
    > #arrow
    > #arrow_face::after {
    left: -10px;
    top: -11px;
    border-top-color: var(--popover-background);
  }

  .svelte-easy-popover[data-popper-placement^="bottom"] > #arrow {
    top: -10px;
  }

  .svelte-easy-popover[data-popper-placement^="bottom"] > #arrow > #arrow_face {
    transform: translateX(-10px);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid var(--foreground-soft);
  }

  .svelte-easy-popover[data-popper-placement^="bottom"]
    > #arrow
    > #arrow_face::after {
    left: -10px;
    top: 1px;
    border-bottom-color: var(--popover-background);
  }

  .svelte-easy-popover[data-popper-placement^="left"] > #arrow {
    right: 0px;
  }

  .svelte-easy-popover[data-popper-placement^="left"] > #arrow > #arrow_face {
    transform: translateY(-10px);
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 10px solid var(--foreground-soft);
  }

  .svelte-easy-popover[data-popper-placement^="left"]
    > #arrow
    > #arrow_face::after {
    left: -11px;
    top: -10px;
    border-left-color: var(--popover-background);
  }

  .svelte-easy-popover[data-popper-placement^="right"] > #arrow {
    left: -9px;
  }

  .svelte-easy-popover[data-popper-placement^="right"] > #arrow > #arrow_face {
    transform: translateY(-10px);
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 10px solid var(--foreground-soft);
  }

  .svelte-easy-popover[data-popper-placement^="right"]
    > #arrow
    > #arrow_face::after {
    left: 1px;
    top: -10px;
    border-right-color: var(--popover-background);
  }
</style>
