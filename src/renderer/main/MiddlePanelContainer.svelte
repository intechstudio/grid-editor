<script>
  import { derived } from "svelte/store";
  import CursorLog from "./user-interface/cursor-log/CursorLog.svelte";
  import Tracker from "./user-interface/Tracker.svelte";
  import ActiveChanges from "./user-interface/ActiveChanges.svelte";
  import ModulConnectionDialog from "./user-interface/ModulConnectionDialog.svelte";
  import { fade, blur, fly } from "svelte/transition";
  import { runtime } from "../runtime/runtime.store";
  import { writeBuffer } from "../runtime/engine.store.ts";
  import { appSettings } from "../runtime/app-helper.store";
  import GridLayout from "./grid-layout/GridLayout.svelte";
  import ModuleHangingDialog from "./user-interface/ModuleHangingDialog.svelte";
  import StickyContainer from "./user-interface/StickyContainer.svelte";
  import { onMount } from "svelte";

  let logLength = 0;
  let trackerVisible = true;

  $: {
    trackerVisible = logLength === 0;
  }

  function handleContentChange(e) {
    const { DOMElementCount } = e.detail;
    logLength = DOMElementCount;
  }

  let showFixedStickyContainer = false;
  let gridLayout;

  function handleResize(e) {
    const stickyContainer = document.getElementById("sticky-container");
    const container = document.getElementById("container");
    const contRect = container.getBoundingClientRect();
    const stickyRect = stickyContainer.getBoundingClientRect();
    const threshold = -15;

    showFixedStickyContainer = !(
      stickyRect.bottom <
      contRect.bottom + threshold
    );
  }

  onMount(() => {
    window.addEventListener("resize", handleResize, true);
  });

  let showModuleHangingDialog = false;
  let moduleHangingTimeout = undefined;

  const pendingActions = derived(writeBuffer, ($writeBuffer) => {
    return $writeBuffer.filter((e) => e.descr.class_name !== "HEARTBEAT");
  });

  $: {
    if (
      $pendingActions.length > 0 &&
      $runtime.length > 0 &&
      typeof moduleHangingTimeout === "undefined"
    ) {
      moduleHangingTimeout = setTimeout(() => {
        showModuleHangingDialog = true;
      }, 1000);
    } else {
      clearTimeout(moduleHangingTimeout);
      showModuleHangingDialog = false;
    }
  }
</script>

<div
  id="container"
  class="relative flex flex-col w-full h-full overflow-visible justify-center"
>
  {#if showFixedStickyContainer}
    <StickyContainer
      class="absolute z-[1] bottom-0 left-1/2 -translate-x-1/2 mb-5"
    />
  {/if}

  <div
    class="absolute top-0 w-fit self-center mt-10 z-[1] bg-primary rounded-lg py-2 px-4 items-center flex-wrap justify-center"
  >
    {#if showModuleHangingDialog}
      <ModuleHangingDialog />
    {:else}
      <ActiveChanges />
    {/if}
  </div>

  <GridLayout
    bind:component={gridLayout}
    on:resize={handleResize}
    class="absolute z-[0] items-center flex flex-col self-center"
  >
    <div
      id="sticky-container"
      class="absolute top-full left-1/2 -translate-x-1/2"
      class:invisible={showFixedStickyContainer || $runtime.length === 0}
    >
      <StickyContainer />
    </div>
  </GridLayout>

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

  <slot />
</div>
