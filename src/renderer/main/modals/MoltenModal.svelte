<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { Modal, modalManager } from "./modal.store";
  import { onMount, onDestroy, tick } from "svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import { reduced_motion_store } from "../../runtime/animations";

  export let data: Modal.Instance;
  export let width: string = "600px";
  // Only consulted when `anchor` is set, to clamp the anchored dialog to the
  // viewport vertically (see .anchored's `top` below). Optional because
  // non-anchored (centered) modals size themselves from content instead.
  export let height: string | undefined = undefined;
  export let style: "normal" | "success" | "error" = "normal";
  export let onkeydown: (e: KeyboardEvent) => void = () => {};
  // When set (Snap.Full only), the modal opens anchored to the left of this
  // element instead of centered, while keeping the usual full-screen backdrop.
  // Positioning itself is native CSS anchor positioning (see .anchored below)
  // - the only JS needed is wiring `anchor-name` onto the caller's element,
  // since it's a raw DOM reference handed to us rather than something we
  // render ourselves. The browser handles recalculation on resize/scroll/etc.
  export let anchor: HTMLElement | undefined = undefined;

  const anchorName = `--molten-modal-anchor-${Math.random().toString(36).slice(2)}`;

  $: animationsDisabled =
    $appSettings.persistent.disableAnimations === "disabled" ||
    ($appSettings.persistent.disableAnimations !== "enabled" &&
      $reduced_motion_store);

  onMount(() => {
    anchor?.style.setProperty("anchor-name", anchorName);
  });

  onDestroy(() => {
    anchor?.style.removeProperty("anchor-name");
  });

  function onkeydown_handle(e) {
    handleModalClose(e);
    onkeydown?.(e);
  }

  function close() {
    if (data.props.disableClickOutside) {
      return;
    }
    data.close();
  }

  let mounted = false;
  let modalElement: HTMLElement;
  onMount(async () => {
    mounted = true;
    await tick();

    if (modalManager.getTop() === data) {
      // preventScroll: an anchored modal can render partially outside the
      // viewport (e.g. anchored near the bottom edge); focus()'s default
      // scroll-into-view behavior would otherwise scroll the whole
      // document (nothing clips overflow on document.body) to compensate,
      // visibly shifting the entire app.
      modalElement.focus({ preventScroll: true });
    }
  });

  function handleModalClose(e: KeyboardEvent) {
    if (modalManager.getTop() !== data) {
      return;
    }

    if (data.props.disableEscapeClose) {
      return;
    }

    if (e.key === "Escape") {
      data.close();
      e.preventDefault();
      e.stopPropagation();
    }
  }
</script>

{#if mounted}
  <!-- A sibling, not a wrapper, of the dialog below: nesting the dialog
       inside this positioned backdrop would make the backdrop its
       containing block, and CSS anchor positioning's `anchor()` only
       resolves when the dialog's containing block is the initial
       containing block (or an ancestor of the anchor) - the real anchor
       lives elsewhere in the app's DOM tree, so it would otherwise be
       invalid and silently fall back to the top-left corner. -->
  <div
    class="z-40 absolute left-0 top-0 w-full h-full"
    style="background-color: color-mix(in srgb, var(--background) 40%, transparent);"
    on:mousedown|self={close}
    aria-hidden="true"
    transition:fade={{ duration: animationsDisabled ? 0 : 100 }}
  ></div>
  <div
    bind:this={modalElement}
    on:keydown={onkeydown_handle}
    role="dialog"
    aria-modal="true"
    aria-label="Modal dialog"
    class="z-50 shadow-md
    rounded-xl max-h-screen bg-background text-foreground focus:outline-none {style}"
    class:snap-full={data.target === Modal.Snap.Full}
    class:snap-grid-layout={data.target === Modal.Snap.GridLayout}
    class:docked={data.target === Modal.Snap.GridLayout}
    class:anchored={!!anchor}
    transition:scale={{ duration: animationsDisabled ? 0 : 150, start: 0.95 }}
    style="--width: {width}; border-color: var(--border); border-radius: var(--radius); {anchor
      ? `position-anchor: ${anchorName}; --height: ${height ?? '0px'};`
      : ''}"
    tabindex="-1"
  >
    <div class="flex flex-col h-full">
      <div class="flex-1 min-h-0">
        <slot name="content" />
      </div>
    </div>
  </div>
{/if}

<style>
  .snap-full {
    @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
    min-width: var(--width);
    max-width: calc(100% - 80px);
    box-sizing: border-box;
  }

  .snap-grid-layout {
    @apply absolute left-0 top-0 w-full h-full;
  }

  /* Overrides .snap-full's centered top/left/transform - relies on
     position-anchor being set inline (see the component's `style`
     attribute) so `anchor()` here resolves against the right anchor.
     top is clamped to the viewport: prefer vertically centering on the
     anchor, but never push the dialog above the viewport or let its bottom
     edge (top + --height) go past it. */
  .anchored {
    top: clamp(
      8px,
      calc(anchor(center) - var(--height) / 2),
      calc(100vh - var(--height) - 8px)
    );
    right: calc(anchor(left) + 8px);
    left: auto;
    transform: none;
  }

  .normal {
    border-style: solid;
    border-width: 1px;
    border-color: var(--background-soft);
  }

  .success {
    border-style: solid;
    border-width: 1px;
    @apply border-commit;
  }

  .error {
    border-style: solid;
    border-width: 1px;
    @apply border-error;
  }

  .docked {
    border-width: 0;
  }
</style>
