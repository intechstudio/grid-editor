<script>
  import CursorLog from "./user-interface/cursor-log/CursorLog.svelte";
  import Tracker from "./user-interface/Tracker.svelte";
  import ActiveChanges from "./user-interface/ActiveChanges.svelte";
  import ModulConnectionDialog from "./user-interface/ModulConnectionDialog.svelte";
  import { fade, blur, fly } from "svelte/transition";
  import { selectedConfigStore } from "../runtime/config-helper.store";
  import { runtime } from "../runtime/runtime.store";
  import { writeBuffer } from "../runtime/engine.store.js";
  import { appSettings } from "../runtime/app-helper.store";
  import GridLayout from "./grid-layout/GridLayout.svelte";
  import ModuleHangingDialog from "./user-interface/ModuleHangingDialog.svelte";
  import StickyContainer from "./user-interface/StickyContainer.svelte";
  import { outOfBounds } from "./_actions/out-of-bounds-action";
  import { derived } from "svelte/store";

  let logLength = 0;
  let trackerVisible = true;

  $: {
    trackerVisible = logLength === 0 && $writeBuffer.length == 0;
  }

  function handleContentChange(e) {
    const { DOMElementCount } = e.detail;
    logLength = DOMElementCount;
  }

  let scale = derived(appSettings, ($appSettings) =>
    Number($appSettings.persistent.size)
  );

  let rotation = derived(appSettings, ($appSettings) =>
    Number($appSettings.persistent.moduleRotation)
  );

  let showFixedStickyContainer = false;
  function handleStickyPositionChange(e) {
    const { inBounds } = e.detail;
    showFixedStickyContainer = !inBounds;
  }
</script>

<div
  id="container"
  class="relative flex flex-col w-full h-full overflow-clip items-center justify-center"
>
  <GridLayout class="absolute items-center flex flex-col">
    <div
      use:outOfBounds={{
        reference: document.getElementById("container"),
        eventListeners: [
          scale.subscribe,
          rotation.subscribe,
          runtime.subscribe,
        ],
        threshold: -30,
      }}
      on:position-change={handleStickyPositionChange}
      class:invisible={showFixedStickyContainer}
    >
      <StickyContainer />
    </div>
  </GridLayout>
  {#if showFixedStickyContainer}
    <StickyContainer class="absolute bottom-0 left-1/2 -translate-x-1/2 mb-5" />
  {/if}
  {#if $writeBuffer.length > 0 && $runtime.length > 0}
    <div
      in:fade={{ delay: 300, duration: 300 }}
      out:blur={{ duration: 150 }}
      class="absolute z-0 top-0 left-0 w-full h-full backdrop-blur-sm bg-primary bg-opacity-20"
    />
  {/if}

  <div
    class="absolute top-0 w-fit self-center mt-10 z-11 bg-primary rounded-lg py-2 px-4 items-center flex-wrap justify-center"
  >
    {#if $writeBuffer.length > 0 && $runtime.length > 0}
      <ModuleHangingDialog />
    {:else}
      <ActiveChanges />
      {#if $selectedConfigStore?.configType === "preset"}
        <button
          class="self-center mt-4 z-10 relative items-center justify-center focus:outline-none bg-select
                      rounded text-white py-1 w-24 hover:bg-yellow-600"
          on:click={() => {
            selectedConfigStore.set({});
          }}
        >
          <div>Cancel</div>
        </button>
      {/if}
    {/if}
  </div>

  {#if $runtime.length == 0 && $appSettings.firmwareNotificationState === 0}
    <div
      in:fade|global={{ delay: 2000, duration: 1000 }}
      out:blur|global={{ duration: 150 }}
      class="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2"
    >
      <ModulConnectionDialog />
    </div>
  {/if}

  <div class="flex">
    {#if trackerVisible}
      <div
        in:fly|global={{ x: -10 }}
        out:fly|global={{ x: 10 }}
        class="w-fit absolute right-0 bottom-0 mb-12 mr-10"
      >
        <Tracker />
      </div>
    {/if}

    <CursorLog
      class="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 z-[1]"
      on:content-change={handleContentChange}
    />
  </div>
</div>
