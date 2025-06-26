<script>
  import { createEventDispatcher } from "svelte";
  import PackagePushButton  from "./PackagePushButton.svelte";

  export let data;
</script>
<div class="flex grow flex-row text-white min-h-[4.5rem] max-h-[4.5rem] m-1">
  <div class="min-w-[4.5rem] bg-white">
  </div>
  <div class="flex grow flex-col px-1">
    <p class="line-clamp-1 overflow-hidden text-ellipsis">{data.name}</p>
    <p class="text-gray-500 text-sm line-clamp-1 overflow-hidden text-ellipsis">Here is some description</p>
    <div class="flex flex-row pt-1 items-center gap-1">
      <p class="text-sm font-medium text-gray-500 grow">@intechstudio</p>
      <PackagePushButton 
        text="Hello" />
      <PackagePushButton 
        text="Hello 2" />
    </div>
  </div>
</div>