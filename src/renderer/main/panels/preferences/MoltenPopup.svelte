<script>
  import { fade } from "svelte/transition";
  export let spaceAway = 5;
  export let text = "";
</script>

<div
  out:fade={{ duration: 300 }}
  class="absolute top-0 left-1/2"
  style="transform: translate(-50%, calc(-100% - {spaceAway}px));"
>
  <div class="bg-black bg-opacity-50 px-2 py-1 rounded whitespace-nowrap">
    {text}
  </div>
</div>
