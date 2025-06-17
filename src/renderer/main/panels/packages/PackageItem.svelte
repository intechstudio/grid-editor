<script>
  import { createEventDispatcher } from "svelte";
  


  export let data;
</script>
<div class="flex flex-row text-white min-h-[4rem] max-h-[4rem] m-1">
  <div class="min-w-[4rem] bg-white">
  </div>
  <div class="flex flex-col px-1">
    <p class="line-clamp-1 overflow-hidden text-ellipsis">{data.name}</p>
    <p class="text-gray-500 text-sm line-clamp-1 overflow-hidden text-ellipsis">Here is some description</p>
    <div class="flex flex-row pt-1">
      <p class="text-sm font-medium">@intechstudio</p>
    </div>
  </div>
</div>