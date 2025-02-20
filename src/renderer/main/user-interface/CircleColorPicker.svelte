<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Grid } from "../../lib/_utils";

  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let cursorElement: HTMLElement;
  let canvasElement: HTMLElement;
  let isDrag = false;

  onMount(() => {
    setCursorPosition(color);
  });

  type Point = { x: number; y: number };

  function pointToDistance(point: Point) {
    return Math.sqrt(point.x ** 2 + point.y ** 2);
  }

  function pointToAngle(p: Point) {
    const theta = (Math.atan2(p.y, p.x) * 180) / Math.PI;
    return theta < 0 ? Math.abs(theta) : 360 - theta;
  }

  function distanceToPoint(distance: number, angle: number): Point {
    const radian = ((360 - angle) * Math.PI) / 180;
    return {
      x: distance * Math.cos(radian),
      y: distance * Math.sin(radian),
    };
  }

  $: setCursorPosition(color);

  function setCursorPosition(color: Grid.HSL) {
    const rect = canvasElement?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const center = { x: rect.width / 2, y: rect.height / 2 };

    const normDist = 1 - Math.max(color.l - 50, 0) / 50;
    const distance = normDist * center.x;
    const p = distanceToPoint(distance, color.h);

    cursorElement.style.left = `${((p.x + center.x) / rect.width) * 100}%`;
    cursorElement.style.top = `${((p.y + center.y) / rect.height) * 100}%`;
  }

  function calculateColor(e: MouseEvent) {
    if (!(e.buttons & 1) || !isDrag) return;

    // Get cursor coordinates relative to the center
    const cursor: Point = {
      x: e.offsetX - canvasElement.getBoundingClientRect().width / 2,
      y: e.offsetY - canvasElement.getBoundingClientRect().height / 2,
    };

    // Normalize distance between 0 and 1
    const distance =
      1 -
      pointToDistance(cursor) /
        (canvasElement.getBoundingClientRect().width / 2);
    const angle = pointToAngle(cursor);
    const hue = Math.floor(angle);
    const brightness = Math.floor(distance * 50 + 50);

    // Update color
    color = new Grid.HSL(hue, 100, brightness);
    dispatch("input", { color });
  }
</script>

<svelte:window
  on:mouseup={(e) => {
    if (isDrag) {
      isDrag = false;
      dispatch("change", { color });
    }
  }}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={canvasElement}
  on:mousedown={(e) => {
    isDrag = true;
    calculateColor(e);
  }}
  on:mousemove={calculateColor}
  class="relative flex border border-black rounded-full h-full aspect-square bg-hue"
>
  <div
    bind:this={cursorElement}
    class="absolute w-2 h-2 rounded-full border border-black pointer-events-none"
  />
</div>

<style>
  .bg-hue {
    border-radius: 50%;
    background: conic-gradient(
        from 90deg,
        red,
        magenta,
        blue,
        cyan,
        lime,
        yellow,
        red
      ),
      radial-gradient(circle at center, white 0, transparent 75%);
    background-size: 100% 100%;
    background-blend-mode: overlay;
  }
</style>
