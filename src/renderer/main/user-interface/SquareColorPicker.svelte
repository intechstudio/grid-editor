<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Grid } from "../../lib/_utils";

  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let canvasElement: HTMLElement;
  let cursorElement: HTMLElement;

  let isDrag = false;

  onMount(() => {
    setCursorPosition(color);
  });

  function setCursorPosition(color: Grid.HSL) {
    const rect = canvasElement.getBoundingClientRect();

    const offsetX = (rect.width * color.h) / 360;
    const offsetY = (rect.height * (color.l - 50)) / 50;

    cursorElement.style.left =
      (Math.min(
        offsetX,
        canvasElement.clientWidth - cursorElement.clientWidth
      ) /
        canvasElement.clientWidth) *
        100 +
      "%";
    cursorElement.style.top =
      (Math.min(
        offsetY,
        canvasElement.clientHeight - cursorElement.clientHeight
      ) /
        canvasElement.clientHeight) *
        100 +
      "%";
  }

  function calculateColor(e: MouseEvent) {
    if (!(e.buttons & 1) || !isDrag) return;

    const rect = canvasElement.getBoundingClientRect();
    const hue = Math.floor(
      Math.max(Math.min((e.clientX - rect.left) / rect.width, 1), 0) * 360
    );
    const brightness = Math.floor(
      Math.max(Math.min((e.clientY - rect.top) / rect.height, 1), 0) * 50 + 50
    );
    color = new Grid.HSL(hue, 100, brightness);
    setCursorPosition(color);
    dispatch("input", { color: color });
  }

  function handleMouseUp() {
    dispatch("change", { color: color });
  }
</script>

<svelte:window
  on:mouseup={() => {
    if (!isDrag) {
      return;
    }

    handleMouseUp();
    isDrag = false;
  }}
  on:mousemove={calculateColor}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={canvasElement}
  data-testid="rgb-color-picker-canvas"
  class="w-full h-full relative border border-black bg-hue"
  on:mousedown={(e) => {
    isDrag = true;
    calculateColor(e);
  }}
>
  <div
    bind:this={cursorElement}
    class="absolute w-2 h-2 rounded-full border border-black pointer-events-none"
  />
</div>

<style>
  .bg-hue {
    background: linear-gradient(
        to left,
        red,
        magenta,
        blue,
        cyan,
        lime,
        yellow,
        red
      ),
      linear-gradient(to top, white, transparent);
    background-size: 100% 100%;
    background-blend-mode: overlay;
  }
</style>
