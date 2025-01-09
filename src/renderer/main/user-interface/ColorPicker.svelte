<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { Grid } from "../../lib/_utils";

  let mounted = false;
  const dispatch = createEventDispatcher();

  export let color: Grid.HSL;

  let container: HTMLElement;
  let colorPreview: HTMLElement;
  let resizeObserver: ResizeObserver;

  let dragParam: Grid.HSLParam;

  type Scale = {
    label: string;
    param: Grid.HSLParam;
    scaleElement: HTMLCanvasElement;
    cursorElement: HTMLElement;
    drawFn: (canvas: HTMLCanvasElement, color: Grid.HSL) => void;
  };

  let componentData: Scale[] = [
    {
      param: Grid.HSLParam.HUE,
      label: "H",
      scaleElement: undefined,
      cursorElement: undefined,
      drawFn: drawHUEScale,
    },
    {
      param: Grid.HSLParam.SATURATION,
      label: "S",
      scaleElement: undefined,
      cursorElement: undefined,
      drawFn: drawSaturationScale,
    },
    {
      param: Grid.HSLParam.LIGHTNESS,
      label: "L",
      scaleElement: undefined,
      cursorElement: undefined,
      drawFn: drawLightnessScale,
    },
  ];

  onMount(() => {
    resizeObserver = new ResizeObserver(() => {
      if (container) {
        drawScales(color);
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    mounted = true;
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect(); // Properly disconnect the observer
    }
  });

  $: if (mounted) {
    drawScales(color);
  }

  function drawScales(color: Grid.HSL) {
    for (const data of componentData) {
      const rect = data.scaleElement.getBoundingClientRect();
      let offsetX =
        (rect.width * color.getParam(data.param)) /
        Grid.HSL.getMaxValue(data.param);
      data.cursorElement.style.left = `${Math.min(
        offsetX,
        data.scaleElement.clientWidth - data.cursorElement.clientWidth
      )}px`;
    }

    for (const data of componentData) {
      if (data.scaleElement) {
        data.drawFn(data.scaleElement, color);
      }
    }
  }

  function drawHUEScale(canvas: HTMLCanvasElement, color: Grid.HSL) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const hGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    const stopCount = 6;
    for (let n = 0; n < stopCount; ++n) {
      hGrad.addColorStop(
        n / (stopCount - 1), // to get smooth gradient between 0 and 1
        new Grid.HSL((360 / stopCount) * n, color.s, color.l).toHEX()
      );
    }

    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawSaturationScale(canvas: HTMLCanvasElement, color: Grid.HSL) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const hGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    hGrad.addColorStop(0, new Grid.HSL(color.h, 0, color.l).toHEX());
    hGrad.addColorStop(1, new Grid.HSL(color.h, 100, color.l).toHEX());

    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawLightnessScale(canvas: HTMLCanvasElement, color: Grid.HSL) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const hGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    hGrad.addColorStop(0, new Grid.HSL(color.h, color.s, 0).toHEX());
    hGrad.addColorStop(0.5, new Grid.HSL(color.h, color.s, 50).toHEX());
    hGrad.addColorStop(1, new Grid.HSL(color.h, color.s, 100).toHEX());

    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function generateRandomColor() {
    color = Grid.RGB.getRandom().toHSL();
    color.s = 100;
    color.l = 50;
    dispatch("change", { color: color });
  }

  function handleCalculateColor(e: MouseEvent) {
    const dragged = componentData.find((e) => e.param === dragParam);
    if (dragged) {
      const { scaleElement } = dragged;
      const rect = scaleElement.getBoundingClientRect();
      let value = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      color = color.setParam(
        dragParam,
        Math.floor(Grid.HSL.getMaxValue(dragParam) * value)
      );
    }
  }
</script>

<svelte:window
  on:mouseup={(e) => {
    if (typeof dragParam === "undefined") {
      return;
    }

    document.removeEventListener("mousemove", handleCalculateColor);
    dragParam = undefined;
    dispatch("change", { color: color });
  }}
/>
<container bind:this={container}>
  <div class="flex flex-row gap-2 items-center">
    <div class="flex flex-col gap-2 flex-grow">
      {#each componentData as { label, param, scaleElement, cursorElement }}
        <div class="flex flex-row gap-2 items-center">
          <span class="text-white text-sm">{label}:</span>
          <div class="relative flex flex-grow h-5">
            <canvas
              bind:this={scaleElement}
              class="w-full h-5 relative border border-black"
              on:mousedown={(e) => {
                if (!(e.buttons & 1)) return;
                dragParam = param;
                handleCalculateColor(e);
                document.addEventListener("mousemove", handleCalculateColor);
              }}
            />
            <div
              bind:this={cursorElement}
              class="absolute w-2 h-full border border-white pointer-events-none"
              style="background-color: {color.toCSS()};border-color: {new Grid.HSL(
                color.h,
                0,
                100 - color.l
              ).toCSS()};"
            />
          </div>
        </div>
      {/each}
    </div>

    <button
      bind:this={colorPreview}
      on:click={generateRandomColor}
      class="group flex h-14 w-14 border border-black"
      style="background-color: {color.toCSS()};"
    >
      <div
        class="preview w-full h-full items-center text-2xl justify-center flex group-hover:opacity-100 opacity-0 transition-opacity"
      />
    </button>
  </div>
</container>

<style>
  @keyframes changeLetter {
    0% {
      content: "⚀";
      transform: rotate(0deg);
    }
    18% {
      content: "⚁";
      transform: rotate(20deg);
    }
    36% {
      content: "⚂";
      transform: rotate(30deg);
    }
    52% {
      content: "⚃";
      transform: rotate(20deg);
    }
    69% {
      content: "⚄";
      transform: rotate(0deg);
    }
    86% {
      content: "⚅";
      transform: rotate(-10deg);
    }
  }

  .preview:hover {
    cursor: pointer;
  }
  .preview::after {
    animation: changeLetter 1s linear infinite;
    content: "⚄";
    font-size: 150%;
  }
</style>
