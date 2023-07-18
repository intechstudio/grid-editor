<script>
  import { createDataPointsStore, PolyLineGraphData } from "./PolyLineGraph";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let incomingData = writable();
  let label = undefined;
  let width = 0;

  let max_value = 0;
  let min_value = 0;
  let avg_value = 0;
  let last_value = 0;

  const data_points = createDataPointsStore({ max_x: 0, max_y: 0 });

  $: if (typeof $incomingData.value !== "undefined") {
    let isPercentage = false;

    if ($incomingData.value.slice(-1) === "%") {
      isPercentage = true;
      console.log("Percent", parseInt($incomingData.value));
    }

    label = $incomingData.type;
    data_points.add(parseInt($incomingData.value), isPercentage);
    const values = data_points.get_values();
    max_value = Math.floor(Math.max(...values));
    min_value = Math.floor(Math.min(...values));
    avg_value = Math.floor(values.reduce((a, b) => a + b, 0) / values.length);
    last_value = Math.floor(parseInt($incomingData.value));
  }

  $: data_points.set_max_values({ max_x: width, max_y: (width / 3) * 2 });

  onMount(() => {
    data_points.set_max_values({ max_x: width, max_y: (width / 3) * 2 });
  });
</script>

<container
  class="container flex justify-center flex-col border border-green-400"
  bind:offsetWidth={width}
>
  <div class="relative">
    <svg
      class="chart stroke-green-400 stroke-1perc"
      viewBox="0 0 {width} {(width / 3) * 2}"
    >
      <polyline class="chart" fill="none" points={$data_points} />
    </svg>
    <div class="flex justify-between w-full h-full px-2">
      <div
        class="text-white absolute left-0 top-1/2 bg-primary bg-opacity-40 transform-translate-y-1/2 text-sm"
      >
        Avg: {avg_value}
      </div>
      <div
        class="text-white absolute left-0 top-3/4 bg-primary bg-opacity-40 transform-translate-y-3/4 text-sm"
      >
        Min: {min_value}
      </div>
      <div
        class="text-white absolute left-0 top-1/4 bg-primary bg-opacity-40 transform -translate-y-1/4 text-sm"
      >
        Max: {max_value}
      </div>
      <div
        class="absolute left-1/2 top-1/2 bg-primary bg-opacity-40 transform -translate-x-1/2 -translate-y-1/2"
      >
        <div class="flex flex-col">
          <span class="text-white font-bold text-xl">{label}</span>
          <span class="text-white text-center text-xs">Last: {last_value}</span>
        </div>
      </div>
    </div>
  </div>
</container>

<style>
  .stroke-1perc {
    stroke-width: 1%;
  }
</style>
