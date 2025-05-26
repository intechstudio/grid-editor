<script lang="ts">
  import { get } from "svelte/store";
  import { modal, Snap } from "./modal.store";

  export let width: number = 600;

  function close() {
    if (get(modal)?.options.disableClickOutside) {
      return;
    }
    modal.close();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="z-40 absolute w-full h-full bg-secondary bg-opacity-50"
  on:mousedown|self={close}
>
  <div
    class="z-50 text-white shadow-md bg-primary rounded max-h-[75vh] w-full"
    style="--width: {width}px"
    class:full={$modal?.options?.snap === Snap.FULL}
    class:middle={$modal?.options?.snap === Snap.MIDDLE}
  >
    <div class="flex flex-col h-full">
      <div class="p-6 flex-1 overflow-auto min-h-0">
        <slot name="content" />
      </div>
    </div>
  </div>
</div>

<style>
  .full {
    @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
    width: var(--width);
    max-width: calc(100% - 80px);
  }

  .middle {
    @apply absolute left-0 top-0 w-full h-full;
  }
</style>
