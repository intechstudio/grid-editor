<script lang="ts">
  import { fade, fly, scale } from "svelte/transition";
  import { Modal, modalManager } from "./modal.store";
  import { onMount } from "svelte";

  export let data: Modal.Instance;
  export let width: string = "600px";

  function close() {
    if (data.props.disableClickOutside) {
      return;
    }
    data.close();
  }

  let mounted = false;
  onMount(() => {
    mounted = true;
  });

  function handleKeyDown(e: KeyboardEvent) {
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

<svelte:window on:keydown={handleKeyDown} />

{#if mounted}
  <div
    role="presentation"
    class="z-40 absolute left-0 top-0 w-full h-full
    bg-secondary bg-opacity-50"
    on:mousedown|self={close}
  >
    <div
      class="z-50 text-white shadow-md
      bg-primary rounded max-h-screen"
      class:snap-full={data.target === Modal.Snap.Full}
      class:snap-grid-layout={data.target === Modal.Snap.GridLayout}
      transition:scale={{ duration: 500, start: 0.95 }}
      style="--width: {width};"
    >
      <div class="flex flex-col h-full">
        <div class="p-6 flex-1 min-h-0">
          <slot name="content" />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .snap-full {
    @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
    width: var(--width);
    max-width: calc(100% - 80px);
    box-sizing: border-box;
  }

  .snap-grid-layout {
    @apply absolute left-0 top-0 w-full h-full;
  }
</style>
