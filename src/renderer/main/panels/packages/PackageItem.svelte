<script>
  import { createEventDispatcher } from "svelte";
  import PackagePushButton  from "./PackagePushButton.svelte";
  import CircularBar from "../../user-interface/CircularBar.svelte"
  import menuIcons from "$lib/menu.icons";

  const dispatch = createEventDispatcher();

  export let data;
</script>
<div class="flex grow flex-row min-h-[4.5rem] max-h-[4.5rem] m-1">
  <div class="min-w-[4.5rem] relative">
    <div class="w-full h-full p-2 fill-white">
      {#if data.svgIcon}
        {@html menuIcons[data.svgIcon]}
      {/if}
    </div>
    {#if data.status == "Downloading"}
      <div class="w-[4.5rem] h-[4.5rem] p-2 flex justify-center items-center absolute">
        <CircularBar 
          value={data.installProgress * 100}
          color="#34d399"
          thickness="10%"/>
      </div>
    {/if}
  </div>
  <div class="flex grow flex-col px-1">
    <p class="line-clamp-1 overflow-hidden text-ellipsis">{data.name}</p>
    <p class="text-gray-500 text-sm line-clamp-1 overflow-hidden text-ellipsis">{data.description ?? "\n"}</p>
    <div class="flex flex-row pt-1 items-center gap-1 ">
      <p class="text-sm font-medium text-gray-500 grow">{data.author}</p>
      {#if data.status !== "Downloading"}
        {#if (data.status === "Downloaded" && data.loadable)}
          <PackagePushButton 
            text="Enable" 
            click={() => dispatch("enable")} />
        {:else if data.status === "Enabled"}
          <PackagePushButton 
            text="Disable"
            click={() => dispatch("disable")} />
        {:else if data.status === "Uninstalled"}
          <PackagePushButton 
            text="Install" 
            click={() => dispatch("download")} />
        {/if}
        {#if data.canUpdate}
          <PackagePushButton 
            text="Update" 
            click={() => dispatch("update")} />
        {/if}
        {#if data.status === "Downloaded" && data.uninstallable}
          <PackagePushButton 
            text="Uninstall" 
            click={() => dispatch("uninstall")} />
        {:else if data.removable}
          <PackagePushButton 
            text="Remove" 
            click={() => dispatch("remove")} />
        {/if}
      {/if}
    </div>
  </div>
</div>