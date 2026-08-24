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
    SvgIcon,
  } from "@intechstudio/grid-uikit";
  import { configTour } from "./ConfigTour";
  import { marked } from "marked";
  import { type Writable } from "svelte/store";
  import { Grid } from "../../../lib/_utils";

  export let markdown = "";
  export let referenceElement: HTMLElement;
  export let updateTrigger: Writable<number>;
  export let position: Grid.Position = Grid.Position.LEFT;

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

{#key $updateTrigger}
  <Popover isOpen={true} {referenceElement} placement={position} spaceAway={10}>
    <div
      class="p-2 rounded bg-secondary flex flex-col border gap-1 border-white/30"
      transition:fade|global={{
        duration: 250,
      }}
    >
      <div class="items-center justify-between flex">
        <span class="text-white">Tour</span>
        <button
          on:click={handleClose}
          class="hover:bg-primary fill-white/30 p-1 rounded"
        >
          <SvgIcon iconPath={"close"} />
        </button>
      </div>
      <div class="bg-primary p-2 text-white mb-2">
        <MarkdownContainer markdown={String(marked(markdown))} />
      </div>
      <div class="flex flex-row gap-2 self-end">
        {#if $configTour && typeof $configTour.previous() !== "undefined"}
          <MoltenPushButton
            text={"Previous"}
            snap={"auto"}
            style={"normal"}
            click={handlePreviousClicked}
          />
        {/if}

        {#if $configTour && typeof $configTour.next() !== "undefined"}
          <MoltenPushButton
            text={"Next"}
            snap={"auto"}
            style={"accept"}
            click={handleNextClicked}
          />
        {/if}

        {#if $configTour && typeof $configTour.next() === "undefined"}
          <MoltenPushButton
            text={"Quit Tour"}
            snap={"auto"}
            style={"accept"}
            click={handleClose}
          />
        {/if}
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
{/key}

<style global>
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
