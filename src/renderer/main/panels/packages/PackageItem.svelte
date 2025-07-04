<script>
  import { createEventDispatcher } from "svelte";
  import PackagePushButton from "./PackagePushButton.svelte";
  import CircularBar from "../../user-interface/CircularBar.svelte";
  import menuIcons from "$lib/menu.icons";
  import { SvgIcon } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  export let data;
</script>

<div class="flex flex-row py-4">
  <div class="min-w-[3.5rem] relative">
    <div
      class="w-full h-full p-3 fill-white absolute flex items-center content-center"
    >
      {#if data.svgIcon}
        {@html menuIcons[data.svgIcon]}
      {:else if data.mainIconPath}
        <img src={data.mainIconPath} alt={data.name} />
      {:else}
        {@html menuIcons["menu_package_general"]}
      {/if}
    </div>
    {#if data.status == "Downloading"}
      <div
        class="w-full h-full absolute"
        style="background-color: #1e262870;"
      />
      <div class="w-full h-full p-1 absolute flex items-center content-center">
        <CircularBar
          value={data.installProgress * 100}
          color="#34d399"
          thickness="10%"
        />
      </div>
    {/if}
  </div>
  <div class="flex grow flex-col px-1">
    <p class="line-clamp-1 overflow-hidden text-ellipsis">{data.name}</p>
    <p
      class="text-gray-500 text-sm line-clamp-1 overflow-hidden text-ellipsis grow"
    >
      {data.description ?? "\n"}
    </p>
    <div class="flex flex-row pt-1 items-center gap-1">
      <div class="bg-secondary rounded-md mr-1">
        {#if data.isOfficial}
          <SvgIcon iconPath="tick" fill="white" />
        {/if}
      </div>
      <p class="text-sm font-medium text-gray-500 grow">{data.author}</p>
      {#if data.status !== "Downloading"}
        {#if data.status === "Downloaded" && data.loadable}
          <PackagePushButton text="Enable" click={() => dispatch("enable")} />
        {:else if data.status === "Enabled"}
          <PackagePushButton text="Disable" click={() => dispatch("disable")} />
        {:else if data.status === "Uninstalled"}
          <PackagePushButton
            text="Install"
            click={() => dispatch("download")}
          />
        {/if}
        {#if data.canUpdate}
          <PackagePushButton text="Update" click={() => dispatch("update")} />
        {/if}
        {#if data.status === "Downloaded" && data.uninstallable}
          <PackagePushButton
            text="Uninstall"
            click={() => dispatch("uninstall")}
          />
        {:else if data.removable}
          <PackagePushButton text="Remove" click={() => dispatch("remove")} />
        {/if}
      {/if}
    </div>
  </div>
</div>
