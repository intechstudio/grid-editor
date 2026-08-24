<script lang="ts">
  import Led from "../elements/Led.svelte";
  import { GridModule, GridRuntime } from "../../../../runtime/runtime.js";

  export let moduleWidth;
  export let id = "ZONA";
  export let device: GridModule;

  let runtime = device.parent as GridRuntime;
  let eps = runtime?.elementPositionStore;
  let lcs = runtime?.ledColorStore;

  let [dx, dy] = [device?.dx, device?.dy];

  const gridSize = 9;
  const pctPositions = Array.from(
    { length: gridSize },
    (_, i) => ((i + 0.5) / gridSize) * 100,
  );
  const segments = Array.from({ length: gridSize - 1 }, (_, i) => i);

  let ledcolor_array = Array(gridSize * gridSize)
    .fill(null)
    .map(() => [0, 0, 0]);

  $: {
    const value = $lcs;
    try {
      let lcs = value[dx][dy];
      for (const key in lcs) {
        ledcolor_array[key] = lcs[key];
      }
    } catch (error) {
      //ERROR
    }
  }

  $: if (id) {
    if (id !== undefined && id.length > 4) {
      dx = +id.split(";")[0].split(":").pop();
      dy = +id.split(";")[1].split(":").pop();
    }
  }
</script>

<div
  {...$$restProps}
  class="module-dimensions relative bg-background"
  style="--module-size: {moduleWidth + 'px'}; transform: rotate({device?.rot *
    -90}deg)"
>
  <div class="module-underlay-container">
    <slot name="module-underlay" {device} />
  </div>

  <!-- Touch element covering the full module -->
  <div class="absolute inset-0">
    <div class="normal-cell-underlay-container">
      <slot name="cell-underlay" elementNumber={0} />
    </div>
    <div class="normal-cell-ui-container">
      <div
        class="absolute inset-0"
        style="background: color-mix(in srgb, var(--background-soft) 30%, transparent);"
      ></div>
      <svg class="absolute inset-0 w-full h-full pointer-events-none">
        {#each pctPositions as pct}
          {#each segments as seg}
            <line
              x1="calc({pctPositions[seg]}% + 4.2px)"
              y1="{pct}%"
              x2="calc({pctPositions[seg + 1]}% - 4.2px)"
              y2="{pct}%"
              stroke="color-mix(in srgb, var(--foreground) 15%, transparent)"
              stroke-width="1"
            />
            <line
              x1="{pct}%"
              y1="calc({pctPositions[seg]}% + 4.2px)"
              x2="{pct}%"
              y2="calc({pctPositions[seg + 1]}% - 4.2px)"
              stroke="color-mix(in srgb, var(--foreground) 15%, transparent)"
              stroke-width="1"
            />
          {/each}
        {/each}
      </svg>
      {#each ledcolor_array as color, i}
        {@const col = i % gridSize}
        {@const row = Math.floor(i / gridSize)}
        <div
          class="absolute"
          style="left: {pctPositions[col]}%; top: {pctPositions[
            row
          ]}%; transform: translate(-50%, -50%);"
        >
          <Led {color} size={0.8} />
        </div>
      {/each}
    </div>
    <div class="normal-cell-overlay-container">
      <slot name="cell-overlay" elementNumber={0} />
    </div>
  </div>

  <!-- System element -->
  <div
    class="bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] system-cell-underlay-container"
  >
    <slot name="cell-underlay" elementNumber={255} />
  </div>
  <div
    class="bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[27px] system-cell-overlay-container"
  >
    <slot name="cell-overlay" elementNumber={255} />
  </div>

  <div class="module-overlay-container">
    <slot name="module-overlay" {device} />
  </div>
</div>
