<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Grid } from "../../lib/_utils";
  import RandomColorGenerator from "./RandomColorGenerator.svelte";

  let mounted = false;
  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let cursorElement: HTMLElement;
  let isDrag = false;

  onMount(() => {
    mounted = true;
  });

  $: if (mounted) {
    const rect = cursorElement.parentElement.getBoundingClientRect();

    const angle = (color.h / Grid.HSL.getMaxValue(Grid.HSLParam.HUE)) * 360;
    const radius = rect.width / 2;
    const offsetX = radius + radius * Math.cos((angle - 90) * (Math.PI / 180));
    const offsetY = radius + radius * Math.sin((angle - 90) * (Math.PI / 180));

    cursorElement.style.left = `${Math.min(
      offsetX,
      rect.width - cursorElement.clientWidth
    )}px`;
    cursorElement.style.top = `${Math.min(
      offsetY,
      rect.height - cursorElement.clientHeight
    )}px`;
  }

  function calculateColor(e: MouseEvent) {
    if (!(e.buttons & 1) || !isDrag) return;

    const rect = cursorElement.parentElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const angle = Math.atan2(
      e.clientY - rect.top - centerY,
      e.clientX - rect.left - centerX
    );
    const distance = Math.min(
      Math.sqrt(
        Math.pow(e.clientX - rect.left - centerX, 2) +
          Math.pow(e.clientY - rect.top - centerY, 2)
      ),
      rect.width / 2
    );

    const hue = (angle * 180) / Math.PI + 180; // Convert from radians to degrees
    const saturation = distance / (rect.width / 2);

    color = new Grid.HSL(
      hue * (Grid.HSL.getMaxValue(Grid.HSLParam.HUE) / 360),
      (1 - saturation) * Grid.HSL.getMaxValue(Grid.HSLParam.SATURATION),
      50
    );
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

<container>
  <div class="grid grid-cols-2 gap-2 place-items-center">
    <div class="flex flex-row h-7 w-full justify-between items-center">
      <div
        class="flex w-1/2 h-full bg-red-500 border border-black rounded-full"
      />
      <span class="text-white text-sm">RGB</span>
    </div>
    <span class="text-white text-sm">Intensity</span>
    <div
      class="relative flex border border-black rounded-full w-full aspect-[1]"
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
      />
    </div>
    <div class="flex h-full w-5 bg-lightness" />

    <div class="grid grid-cols-3 w-full">
      <div class="flex flex-grow h-7 bg-select border border-black" />
      <div class="flex flex-grow h-7 bg-select border border-black" />
      <div class="flex flex-grow h-7 bg-select border border-black" />
    </div>

    <div class="flex flex-grow h-7 w-2/3 bg-select border border-black" />
  </div>
</container>

<style>
  .bg-hue {
    background: conic-gradient(
      red,
      orange,
      yellow,
      green,
      cyan,
      blue,
      magenta,
      red
    );
  }

  .bg-saturation {
    background: radial-gradient(circle at center, white 0, transparent 50%);
  }

  .bg-lightness {
    background: linear-gradient(to top, black, white);
  }
</style>
