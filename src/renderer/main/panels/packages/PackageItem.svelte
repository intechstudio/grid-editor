<script>
  import { createEventDispatcher } from "svelte";
  import PackagePushButton from "./PackagePushButton.svelte";
  import CircularBar from "../../user-interface/CircularBar.svelte";
  import menuIcons from "$lib/menu.icons";
  import icons from "$lib/icons";
  import { contextTarget } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  export let data;

  let contextItems = [];
  $: (data, refreshContextItems());
  function refreshContextItems() {
    while (contextItems.length > 0) {
      contextItems.pop();
    }
    if (data.installProgress !== undefined) {
      return;
    }
    if (data.isDownloaded && !data.isEnabled && data.loadable) {
      contextItems.push({
        text: [`Enable`, ""],
        handler: () => dispatch("enable"),
        isDisabled: () => false,
      });
    }
    if (data.canUpdate) {
      contextItems.push({
        text: [`Update`, ""],
        handler: () => dispatch("update"),
        isDisabled: () => false,
      });
    }
    if (data.isEnabled && data.isDownloaded) {
      contextItems.push({
        text: [`Disable`, ""],
        handler: () => dispatch("disable"),
        isDisabled: () => false,
      });
    }
    if (data.removable) {
      contextItems.push({
        text: [`Remove`, ""],
        handler: () => dispatch("remove"),
        isDisabled: () => false,
      });
    }
    if (data.isDownloaded && data.uninstallable) {
      contextItems.push({
        text: [`Uninstall`, ""],
        handler: () => dispatch("uninstall"),
        isDisabled: () => false,
      });
    }
  }

  let eventSource;
</script>

<div
  class="flex flex-row py-4"
  use:contextTarget={{
    items: contextItems,
  }}
>
  <div class="min-w-[3.25rem] relative mr-1">
    <div class="w-full h-full absolute flex items-center content-center">
      <div class="p-2 fill-white w-full rounded-lg bg-secondary">
        {#if data.svgIcon}
          {@html menuIcons[data.svgIcon]}
        {:else if data.mainIconPath}
          <img src={data.mainIconPath} alt={data.name} />
        {:else}
          {@html menuIcons["menu_package_general"]}
        {/if}
      </div>
    </div>
    {#if data.installProgress !== undefined}
      <div
        class="w-full h-full absolute"
        style="background-color: #1e262870;"
      ></div>
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
    <p class="line-clamp-1 overflow-hidden text-ellipsis">
      {data.name}{data.packageVersion ? ` - ${data.packageVersion}` : ""}
    </p>
    <p
      class="text-gray-500 text-sm line-clamp-1 overflow-hidden text-ellipsis grow"
    >
      {data.description ?? "\n"}
    </p>
    <div class="flex flex-row pt-1 items-center gap-1" bind:this={eventSource}>
      {#if data.isOfficial}
        <div class="bg-secondary rounded-md mr-1 p-1">
          {@html icons["logo_wave_white"]}
        </div>
      {/if}
      <p class="text-sm font-medium text-gray-500 grow">{data.author}</p>
      {#if data.installProgress === undefined}
        {#if data.isDownloaded && !data.isEnabled && data.loadable}
          <PackagePushButton text="Enable" click={() => dispatch("enable")} />
        {:else if !data.isDownloaded}
          <PackagePushButton
            text="Install"
            click={() => dispatch("download")}
          />
        {/if}
        {#if data.canUpdate}
          <PackagePushButton text="Update" click={() => dispatch("update")} />
        {/if}
        {#if data.isDownloaded}
          <PackagePushButton
            icon={"preferences"}
            click={(e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              const event = new PointerEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                type: "contextmenu",
                clientX: e.clientX,
                clientY: e.clientY,
              });
              eventSource.dispatchEvent(event);
            }}
          />
        {/if}
      {/if}
    </div>
  </div>
</div>
