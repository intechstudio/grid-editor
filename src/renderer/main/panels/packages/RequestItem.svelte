<script>
  import { createEventDispatcher } from "svelte";
  import PackagePushButton  from "./PackagePushButton.svelte";

  let dispatch = createEventDispatcher();
  export let request;
</script>
<div class="flex grow flex-row text-white min-h-[4.5rem] max-h-[4.5rem] m-1">
  <div class="min-w-[4.5rem] bg-transparent">
  </div>
  <div class="flex grow flex-col px-1">
    <p class="line-clamp-1 overflow-hidden text-ellipsis">{request.name}</p>
    <p class="text-gray-500 text-sm line-clamp-1 overflow-hidden text-ellipsis">Do you approve integrating package {request.name}</p>
    <div class="flex flex-row pt-1 items-center gap-1">
      <p class="text-sm font-medium text-gray-500 grow">Local</p>
      <PackagePushButton 
        text="Accept" 
        click={() => {dispatch("accept")}}/>
      <PackagePushButton 
        text="Reject" 
        click={() => {dispatch("reject")}}/>
    </div>
  </div>
</div>