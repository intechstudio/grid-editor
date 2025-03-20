<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  export let max: number = 100;
  export let direction: "horizontal" | "vertical";
  export let round = false;
  export let value: any;

  let scaleElement: HTMLElement;
  let cursorElement: HTMLElement;
  let isDrag = false;

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => {
      setCursorPosition(value);
    });

    setCursorPosition(value);
    resizeObserver.observe(scaleElement);
  });

  $: setCursorPosition(value);

  function handleCursorDrag(e: MouseEvent) {
    const rect = scaleElement?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    let normalized: number;
    switch (direction) {
      case "vertical": {
        normalized =
          1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        break;
      }
      case "horizontal": {
        normalized = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        break;
      }
    }

    value =
      Math.round(max * normalized * (round ? 1 : 100)) / (round ? 1 : 100);
    setCursorPosition(value);
    dispatch("input", { value: value });
  }

  function setCursorPosition(value: number | undefined) {
    if (value == null || Number.isNaN(value)) {
      return;
    }

    const scaleRect = scaleElement?.getBoundingClientRect();
    const cursorRect = cursorElement?.getBoundingClientRect();

    if (!scaleRect || !cursorRect) {
      return;
    }

    const normValue = Math.max(0, Math.min(value / max, 1));

    switch (direction) {
      case "vertical": {
        const position = (1 - normValue) * 100;
        const maxPosition =
          ((scaleRect.height - cursorRect.height) / scaleRect.height) * 100;
        cursorElement.style.top = `${Math.min(position, maxPosition)}%`;
        break;
      }
      case "horizontal": {
        const position = normValue * 100;
        const maxPosition =
          ((scaleRect.width - cursorRect.width) / scaleRect.width) * 100;
        cursorElement.style.left = `${Math.min(position, maxPosition)}%`;
        break;
      }
    }
  }
</script>

<svelte:window
  on:mouseup={(e) => {
    if (!isDrag) {
      return;
    }

    isDrag = false;
    document.removeEventListener("mousemove", handleCursorDrag);
    dispatch("change", { value: value });
  }}
/>

<div
  class="relative flex {direction === 'vertical' ? 'h-full w-5' : 'w-full h-5'}"
>
  <canvas
    bind:this={scaleElement}
    class="w-full h-full relative"
    on:mousedown={(e) => {
      if (!(e.buttons & 1)) return;
      isDrag = true;
      document.addEventListener("mousemove", handleCursorDrag);
      handleCursorDrag(e);
    }}
  />
  <div
    class="absolute w-full h-full border border-black pointer-events-none bg-white"
  >
    <slot />
  </div>
  <div
    bind:this={cursorElement}
    class="absolute border border-black pointer-events-none bg-white bg-opacity-25 {direction ===
    'vertical'
      ? 'h-2 w-full'
      : 'w-2 h-full'}"
    class:invisible={typeof value === "undefined" || isNaN(+value)}
  />
</div>
