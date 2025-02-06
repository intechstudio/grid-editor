<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Grid } from "../../lib/_utils";
  import RandomColorGenerator from "./RandomColorGenerator.svelte";

  let mounted = false;
  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let cursorElement: HTMLElement;
  let canvasElement: HTMLElement;
  let isDrag = false;

  onMount(() => {
    mounted = true;
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

  $: {
    if (mounted) {
      setCursorPosition(color);
    }
  }

  function setCursorPosition(color: Grid.HSL) {
    const rect = canvasElement.getBoundingClientRect();

    // Calculate center of the canvas
    const center = { x: rect.width / 2, y: rect.height / 2 };

    // Convert color to polar coordinates (distance = saturation, angle = hue)
    const radius =
      (color.s / Grid.HSL.getMaxValue(Grid.HSLParam.SATURATION)) *
      (rect.width / 2);
    const p = distanceToPoint(radius, color.h);

    // Update cursor position (adjust to the canvas coordinate system)
    cursorElement.style.left = `${
      p.x + center.x - cursorElement.clientWidth / 2
    }px`;
    cursorElement.style.top = `${
      p.y + center.y - cursorElement.clientHeight / 2
    }px`;
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
      pointToDistance(cursor) /
      (canvasElement.getBoundingClientRect().width / 2);
    const angle = pointToAngle(cursor);

    // Update color
    color = new Grid.HSL(
      angle,
      Math.min(distance * Grid.HSL.getMaxValue(Grid.HSLParam.SATURATION), 100),
      50
    );
  }
</script>

<svelte:window
  on:mouseup={(e) => {
    if (isDrag) {
      isDrag = false;
      dispatch("change", { color: color });
    }
  }}
/>

<container class="flex w-full h-full">
  <div
    bind:this={canvasElement}
    class="relative flex border border-black rounded-full w-hull aspect-square"
  >
    <div class="absolute bg-hue w-full h-full rounded-full" />
    <div class="absolute bg-saturation w-full h-full rounded-full" />
    <div
      bind:this={cursorElement}
      class="absolute w-2 h-2 rounded-full border border-black pointer-events-none"
    />
    <button
      class="absolute w-full h-full cursor-pointer"
      on:mousedown={(e) => {
        isDrag = true;
        calculateColor(e);
      }}
      on:mousemove={calculateColor}
    />
  </div>
</container>

<style>
  .bg-hue {
    background: conic-gradient(
      yellow,
      orange,
      red,
      magenta,
      blue,
      cyan,
      green,
      yellow
    );
  }

  .bg-saturation {
    background: radial-gradient(circle at center, white 0, transparent 50%);
  }
</style>
