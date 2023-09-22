<script lang="ts">
  import { createSlider, melt } from "@melt-ui/svelte";

  export let target;

  export let min;
  export let max;
  export let step;

  const {
    elements: { root, range, thumb },
    states: { value },
  } = createSlider({
    min: min,
    max: max,
    step: step,
  });

  let oldTarget;

  $: {
    //console.log("Target", target);
    if (target !== oldTarget) {
      $value[0] = target;
      oldTarget = target;
    }

    if (target !== $value[0]) {
      oldTarget = target = $value[0];
    }
  }

  // }
</script>

<span {...$root} use:root class="relative flex w-[200px] items-center h-[26px]">
  <span class="block h-[3px] w-full bg-white rounded-full h-[8px]">
    <span
      {...$range}
      use:range
      class="h-[3px] bg-neutral-500 rounded-full h-[8px]"
    />
  </span>
  <span
    {...$thumb()}
    use:thumb
    class="block h-5 w-5 rounded-full bg-neutral-500 focus:ring-2 focus:ring-black/40"
  />
</span>
