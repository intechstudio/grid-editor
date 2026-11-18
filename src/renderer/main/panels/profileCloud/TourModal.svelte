<script lang="ts">
  import {
    MarkdownContainer,
    MoltenPushButton,
  } from "@intechstudio/grid-uikit";
  import { marked } from "marked";
  import MoltenModal from "../../modals/MoltenModal.svelte";
  import { type Modal } from "../../modals/modal.store";
  import { Grid } from "../../../lib/_utils";
  import { configTour } from "./ConfigTour";
  import { onMount, onDestroy } from "svelte";

  export let data: Modal.Instance;
  export let markdown = "";
  export let anchor: HTMLElement;
  export let position: Grid.Position = Grid.Position.LEFT;

  // When the anchor is removed from the DOM (e.g. the user navigated to a
  // different element) or hidden, anchored positioning cannot resolve and the
  // modal would fall off screen: show it centered instead.
  let anchorLost = false;
  let resizeObserver: ResizeObserver | undefined;

  function checkAnchor() {
    anchorLost = !anchor?.isConnected || anchor.getClientRects().length === 0;
  }

  onMount(() => {
    checkAnchor();
    // Fires when the observed element is removed or its size changes
    resizeObserver = new ResizeObserver(checkAnchor);
    if (anchor) resizeObserver.observe(anchor);
  });

  onDestroy(() => resizeObserver?.disconnect());

  $: isLastStep = !$configTour || typeof $configTour.next() === "undefined";
  $: isFirstStep =
    !$configTour || typeof $configTour.previous() === "undefined";
</script>

<MoltenModal
  {data}
  width="20rem"
  anchor={anchorLost ? undefined : anchor}
  placement={position}
  backdrop={false}
>
  <div slot="content" class="p-2 flex flex-col gap-1 text-foreground">
    <div class="mb-2">
      <MarkdownContainer markdown={String(marked(markdown))} />
    </div>
    <div class="flex flex-row gap-2 items-center justify-between">
      <MoltenPushButton
        text={"Quit Tour"}
        snap={"auto"}
        style={isLastStep ? "accept" : "normal"}
        click={() => configTour.clear()}
      />
      <div class="flex flex-row gap-2">
        <MoltenPushButton
          text={"Previous"}
          snap={"auto"}
          style={"normal"}
          disabled={isFirstStep}
          click={() => configTour.stepBackward()}
        />
        <MoltenPushButton
          text={"Next"}
          snap={"auto"}
          style={isLastStep ? "normal" : "accept"}
          disabled={isLastStep}
          click={() => configTour.stepForward()}
        />
      </div>
    </div>
  </div>
</MoltenModal>
