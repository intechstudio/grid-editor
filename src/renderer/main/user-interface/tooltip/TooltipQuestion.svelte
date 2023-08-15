<script>
  import Tooltip from "./Tooltip.svelte";

  export let key = "";
</script>

<div
  class="w-6 h-6 mx-2 border border-solid border-primary cursor-pointer relative rounded-full bg-secondary text-center flex items-center justify-center p-1 group"
>
  <span class="group-hover:text-important text-xs">?</span>
  <Tooltip
    {key}
    placement={"top"}
    class="w-60 p-4"
    instant={true}
    triggerEvents={["hover"]}
  />
</div>
