<script lang="ts">
  import { modal } from "./modal.store.ts";

  export let width: number = 600;

  function close() {
    modal.close();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="z-40 absolute w-full h-full
    bg-secondary bg-opacity-50"
  on:click|self={close}
>
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-white shadow-md py-6 px-12
      bg-primary rounded"
    style="width: {width}px; max-width: calc(100% - 80px)"
  >
    <slot name="content" />
  </div>
</div>
