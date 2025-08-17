<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  interface Props {
    rows?: number;
    cols?: number;
    baseColor?: string; // Bright green like Matrix
  }

  let { rows = 7, cols = 7, baseColor = "#2563eb" }: Props = $props();

  // Create grid data with random values and random delays
  const grid = Array.from({ length: rows * cols }, () => ({
    value: Math.random() < 0.5 ? "0" : "1",
    delay: Math.random() * 2, // Random delay in seconds
  }));
</script>

<div
  class="grid absolute top-0 left-0 w-full h-full gap-1 rounded border-2 border-white/30"
  style={`grid-template-columns: repeat(${cols}, 1fr); background-color: ${baseColor};`}
>
  {#each grid as cell}
    <div
      class="flash aspect-square w-full flex items-center justify-center text-center select-none leading-none"
      style={`--base-color: ${baseColor}; animation-delay: ${cell.delay}s; font-size: 125%;`}
    >
      {cell.value}
    </div>
  {/each}

  <div class="absolute w-full h-full flex flex-col items-center justify-center">
    <div class="flex-col rounded px-4 py-2 items-center flex bg-black/50 gap-2">
      <div class="flex flex-col items-center">
        <span>Grid ESP32 bootloader is detected!</span>
        <span> E:\</span>
      </div>

      <div class="flex flex-row gap-2">
        <MoltenPushButton text={"Update"} style="accept" click={() => {}} />

        <MoltenPushButton text={"Nightly"} click={() => {}} />
      </div>
      <MoltenPushButton text={"Cancel"} click={() => {}} />
    </div>
  </div>
</div>

<style>
  @keyframes flash {
    0%,
    100% {
      color: rgba(255, 255, 255, 0.3);
    }
    50% {
      color: var(--base-color);
    }
  }

  .flash {
    animation: flash 3s infinite alternate;
  }
</style>
