<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Grid } from "../../lib/_utils";
  import RandomColorGenerator from "./RandomColorGenerator.svelte";

  let mounted = false;
  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let canvasElement: HTMLCanvasElement, cursorElement: HTMLElement;
  let isDrag = false;

  onMount(() => {
    initColorPicker();
    mounted = true;
  });

  $: if (mounted) {
    const rect = canvasElement.getBoundingClientRect();

    const offsetX =
      rect.width * (color.h / Grid.HSL.getMaxValue(Grid.HSLParam.HUE));
    const offsetY =
      rect.height *
      (1 - color.s / Grid.HSL.getMaxValue(Grid.HSLParam.SATURATION));

    cursorElement.style.left = `${Math.min(
      offsetX,
      canvasElement.clientWidth - cursorElement.clientWidth
    )}px`;
    cursorElement.style.top = `${Math.min(
      offsetY,
      canvasElement.clientHeight - cursorElement.clientHeight
    )}px`;
  }

  function initColorPicker() {
    var ctx = canvasElement.getContext("2d");
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, 0, 150, 75);

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    var hGrad = ctx.createLinearGradient(0, 0, canvasElement.width, 0);
    hGrad.addColorStop(0 / 6, "#F00");
    hGrad.addColorStop(1 / 6, "#FF0");
    hGrad.addColorStop(2 / 6, "#0F0");
    hGrad.addColorStop(3 / 6, "#0FF");
    hGrad.addColorStop(4 / 6, "#00F");
    hGrad.addColorStop(5 / 6, "#F0F");
    hGrad.addColorStop(6 / 6, "#F00");

    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    var vGrad = ctx.createLinearGradient(0, 0, 0, canvasElement.height);

    vGrad.addColorStop(0, "rgba(255,255,255,0)");
    vGrad.addColorStop(1, "rgba(255,255,255,1)");

    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  }

  function calculateColor(e: MouseEvent) {
    if (!(e.buttons & 1) || !isDrag) return;

    const rect = canvasElement.getBoundingClientRect();
    const hue = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const saturation = Math.max(
      0,
      Math.min(1, (e.clientY - rect.top) / rect.height)
    );

    color = new Grid.HSL(
      hue * Grid.HSL.getMaxValue(Grid.HSLParam.HUE),
      (1 - saturation) * Grid.HSL.getMaxValue(Grid.HSLParam.SATURATION),
      50
    );
  }

  function handleMouseUp() {
    dispatch("change", { color: color });
  }

  function handleRandomColorPick(e: any) {
    const { color } = e.detail;
    dispatch("change", { color: color });
  }
</script>

<svelte:window
  on:mouseup={() => {
    isDrag = false;
    handleMouseUp();
  }}
  on:mousemove={calculateColor}
/>

<container>
  <div class="flex flex-row gap-2 justify-center items-center">
    <div class="relative flex flex-grow h-20">
      <canvas
        data-testid="rgb-color-picker-canvas"
        bind:this={canvasElement}
        class="w-full h-full relative border border-black"
        on:mousedown={(e) => {
          isDrag = true;
          calculateColor(e);
        }}
      />
      <div
        bind:this={cursorElement}
        class="absolute w-2 h-2 rounded-full border border-black pointer-events-none"
      />
    </div>

    <RandomColorGenerator {color} on:generate={handleRandomColorPick} />
  </div>
</container>
