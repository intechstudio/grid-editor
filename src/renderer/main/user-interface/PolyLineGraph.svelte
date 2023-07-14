<script>
  import { createDataPointsStore, PolyLineGraphData } from "./PolyLineGraph";
  import { onMount } from "svelte";

  onMount(() => {
    console.log("Mount");
  });

  export let incomingData = undefined;
  export let label = undefined;

  const data = [];
  const data_points = createDataPointsStore(data);

  $: if (typeof incomingData !== "undefined") {
    console.log("yay");
    data_points.add(incomingData);
  }
</script>

<container class="flex flex-col border border-red-500"
  ><span class="text-whites">{label}</span>
  <svg viewBox="0 0 100 50">
    <polyline class="chart" fill="none" points={$data_points} />
  </svg>
</container>

<style>
  .chart {
    stroke-width: 1;
    stroke: rgba(255, 0, 0, 1);
  }
</style>
