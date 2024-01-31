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

  const styleMap = {
    [Snap.FULL]: {
      class: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      style: `width: ${width}px; max-width: calc(100% - 80px);`,
    },
    [Snap.MIDDLE]: {
      class: "absolute left-0 top-0 w-full h-full",
      style: "",
    },
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="z-40 absolute w-full h-full
    bg-secondary bg-opacity-50"
  on:click|self={close}
>
  <div
    class="z-50 text-white shadow-md p-6
      bg-primary rounded {styleMap[$modal?.options.snap]?.class}"
    style={styleMap[$modal?.options.snap]?.style}
  >
    <slot name="content" />
  </div>
</div>
