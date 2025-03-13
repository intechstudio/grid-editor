<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();

  export let value: any;
  export let max: number = 100;
  export let direction: "horizontal" | "vertical";
  export let round = false;

  let scaleElement: HTMLElement;
  let cursorElement: HTMLElement;
  let isDrag = false;

  onMount(() => {
    setCursorPosition(value);
  });

  //$: setCursorPosition(value);

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
          Math.min(1, (e.clientX - rect.left) / rect.width)
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
    if (Number.isNaN(value)) {
      return;
    }

    const rect = scaleElement?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    switch (direction) {
      case "vertical": {
        const position = rect.height - (rect.height * value) / max;
        const maxPosition =
          rect.height - cursorElement.getBoundingClientRect().height;
        cursorElement.style.top = `${Math.min(position, maxPosition)}px`;
        break;
      }
      case "horizontal": {
        const position = (rect.width * value) / max;
        const maxPosition =
          rect.width - cursorElement.getBoundingClientRect().width;
        cursorElement.style.left = `${Math.min(position, maxPosition)}px`;
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
  <div class="absolute w-full h-full border border-black pointer-events-none">
    <slot />
  </div>
  <div
    bind:this={cursorElement}
    class="absolute border border-black pointer-events-none bg-white bg-opacity-25 {direction ===
    'vertical'
      ? 'h-2 w-full'
      : 'w-2 h-full'}"
    class:hidden={typeof value === "undefined" || isNaN(+value)}
  />
</div>
