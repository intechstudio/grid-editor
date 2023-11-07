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
  class="{$$props.class} w-6 h-6 p-1 border border-solid border-primary cursor-pointer relative rounded-full bg-secondary text-center flex items-center justify-center"
>
  <span class="text-xs">?</span>
</div>
