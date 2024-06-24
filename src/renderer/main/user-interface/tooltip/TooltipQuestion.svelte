<script>
  import { tooltip } from "./../../_actions/tooltip.ts";

  export let key;
  export let text;
</script>

<div
  use:tooltip={{
    key: key,
    placement: "top",
    class: "w-60 p-4",
    text: text,
  }}
  class="{$$props.class} w-6 h-6 p-1 border border-solid border-primary cursor-pointer relative rounded-full bg-secondary text-center flex items-center justify-center"
>
  <span class="text-xs">?</span>
</div>
