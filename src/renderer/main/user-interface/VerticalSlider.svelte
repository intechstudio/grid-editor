<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  export let value: number = 0;
  export let max: number = 100;

  let scaleElement: HTMLElement;
  let cursorElement: HTMLElement;
  let isDrag = false;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  $: {
    if (mounted) {
      handleValueChange(value);
    }
  }

  function handleDragCursor(e: MouseEvent) {
    const rect = scaleElement.getBoundingClientRect();
    const normalized =
      1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    value = Math.round(max * normalized * 100) / 100;
  }

  function handleValueChange(value: number) {
    const rect = scaleElement.getBoundingClientRect();
    const position = rect.height - (rect.height * value) / max;
    const maxPosition =
      rect.height - cursorElement.getBoundingClientRect().height;
    cursorElement.style.top = `${Math.min(position, maxPosition)}px`;

    dispatch("input", { value: value });
  }
</script>

<svelte:window
  on:mouseup={(e) => {
    if (!isDrag) {
      return;
    }
    isDrag = false;
    document.removeEventListener("mousemove", handleDragCursor);
    dispatch("change", { value: value });
  }}
/>

<div class="relative flex w-5 h-full">
  <canvas
    bind:this={scaleElement}
    class="w-full h-full relative"
    on:mousedown={(e) => {
      if (!(e.buttons & 1)) return;
      isDrag = true;
      document.addEventListener("mousemove", handleDragCursor);
      handleDragCursor(e);
    }}
  />
  <div class="absolute w-full h-full border border-black pointer-events-none">
    <slot />
  </div>
  <div
    bind:this={cursorElement}
    class="absolute h-3 border border-black pointer-events-none bg-white"
    style="width: calc(100% + 4px); transform: translateX(-2px);"
  />
</div>
