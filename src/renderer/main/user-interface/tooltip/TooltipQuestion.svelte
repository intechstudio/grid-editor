<script>
  import { setTooltip } from "./Tooltip";

  export let key = "";
</script>

<div
  use:setTooltip={{
    key: key,
    placement: "top",
    class: "p-4 w-60",
    instant: true,
  }}
  class="w-6 h-6 mx-2 border border-solid border-primary cursor-pointer relative rounded-full bg-secondary text-center flex items-center justify-center p-1 group"
>
  <span class="group-hover:text-important text-xs">?</span>
</div>
