<script>
  import Tooltip from "./Tooltip.svelte";

  export let key = "";
  export let mode = 0;
</script>

<div
  class="w-6 h-6 mx-2 border border-solid border-primary cursor-pointer relative rounded-full bg-secondary text-center text-xs flex items-center justify-center hover:text-important p-1"
>
  ?
  <Tooltip {key} placement="bottom" class="w-60 p-4" />
</div>
