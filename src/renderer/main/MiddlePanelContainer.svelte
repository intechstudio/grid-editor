<script lang="ts">
  import CursorLog from "./user-interface/cursor-log/CursorLog.svelte";
  import Tracker from "./user-interface/Tracker.svelte";
  import ActiveChanges from "./user-interface/ActiveChanges.svelte";
  import ModulConnectionDialog from "./user-interface/ModulConnectionDialog.svelte";
  import { fade, blur, fly } from "svelte/transition";
  import { appSettings } from "../runtime/app-helper.store";
  import GridLayout from "./grid-layout/GridLayout.svelte";
  import MinimapDevice from "./grid-layout/minimap/MinimapDevice.svelte";
  import ModuleHangingDialog from "./user-interface/ModuleHangingDialog.svelte";
  import StickyContainer from "./user-interface/StickyContainer.svelte";
  import ControlSurface from "./panels/configuration/components/ControlSurface.svelte";
  import { runtime_manager } from "../runtime/runtime-manager.store";
  import { GridRuntime } from "../runtime/runtime";
  import { ModuleType } from "@intechstudio/grid-protocol";
  import Minimap from "./grid-layout/minimap/Minimap.svelte";

  let logLength = 0;
  let trackerVisible = true;
  let stickyContainer: HTMLElement;
  let container: HTMLElement;

  $: {
    trackerVisible = logLength === 0;
  }

  function handleContentChange(e) {
    const { DOMElementCount } = e.detail;
    logLength = DOMElementCount;
  }

  let showFixedStickyContainer = false;
  let gridLayout;

  let runtime: GridRuntime;
  $: runtime = $runtime_manager.active.runtime;

  function handleResize() {
    const contRect = container?.getBoundingClientRect();
    const stickyRect = stickyContainer?.getBoundingClientRect();

    if (!contRect || !stickyRect) return;

    const threshold = -15;

    showFixedStickyContainer =
      stickyRect.bottom >= contRect.bottom + threshold ||
      stickyRect.top <= contRect.top - threshold ||
      stickyRect.left <= contRect.left - threshold ||
      stickyRect.right >= contRect.right + threshold;
  }

  $: handleGridLayoutShift($appSettings.gridLayoutShift);

  function handleGridLayoutShift(vector) {
    if (vector.x === 0 && vector.y === 0) {
      return;
    }

    handleResize();
  }

  let showModuleHangingDialog = false;
  let moduleHangingTimeout = undefined;

  /*
  const pendingActions = derived(writeBuffer, ($writeBuffer) => {
    return $writeBuffer.filter((e) => e.descr.class_name !== "HEARTBEAT");
  });

  $: {
    if (
      $pendingActions.length > 0 &&
      $runtime.modules.length > 0 &&
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
    */
</script>

<svelte:window on:resize={handleResize} />

<div
  bind:this={container}
  class="relative flex flex-col w-full h-full overflow-hidden justify-center"
>
  <ControlSurface />
  {#if showFixedStickyContainer}
    <StickyContainer
      class="absolute z-[2] bottom-0 left-1/2 -translate-x-1/2 mb-5"
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
    class="absolute z-[0] top-1/2 left-1/2 flex flex-col"
    style="transform: translate(calc(-50% + {$appSettings.gridLayoutShift
      .x}px), calc(-50% + {$appSettings.gridLayoutShift.y}px));"
  >
    <div
      bind:this={stickyContainer}
      class="absolute top-full left-1/2 -translate-x-1/2"
      class:invisible={showFixedStickyContainer ||
        $runtime.modules.length === 0}
    >
      <StickyContainer />
    </div>
  </GridLayout>

  {#if $runtime.modules.length == 0 && $appSettings.firmwareNotificationState === 0}
    <div
      in:fade|global={{ delay: 2000, duration: 1000 }}
      out:blur|global={{ duration: 150 }}
      class="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2"
    >
      <!-- <ModulConnectionDialog /> -->
      <Minimap />
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
      class="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 z-[2]"
      on:content-change={handleContentChange}
    />
  </div>
</div>
