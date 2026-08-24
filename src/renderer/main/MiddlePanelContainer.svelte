<script lang="ts">
  import CursorLog from "./user-interface/cursor-log/CursorLog.svelte";
  import Tracker from "./user-interface/Tracker.svelte";
  import ActiveChanges from "./user-interface/ActiveChanges.svelte";
  import ModulConnectionDialog from "./user-interface/ModulConnectionDialog.svelte";
  import { fade, blur, fly } from "svelte/transition";
  import { appSettings, splitpanes } from "../runtime/app-helper.store";
  import GridLayout from "./grid-layout/GridLayout.svelte";
  import StickyContainer from "./user-interface/StickyContainer.svelte";
  import ControlSurface from "./panels/configuration/components/ControlSurface.svelte";
  import { runtime_manager } from "../runtime/runtime-manager.store";
  import { GridRuntime } from "../runtime/runtime";
  import { Modal } from "./modals/modal.store";
  import MiniMap from "./grid-layout/MiniMap.svelte";
  import { derived, get } from "svelte/store";
  import PanelToggleButton from "./PanelToggleButton.svelte";
  import { Pane, Splitpanes } from "svelte-splitpanes";
  import { onMount } from "svelte";

  let logLength = 0;
  let trackerVisible = true;
  let stickyContainer: HTMLElement;
  let container: HTMLElement;

  onMount(() => {
    splitpanes.update((s) => {
      s.minimap.size = get(appSettings).persistent.minimapToggled
        ? $splitpanes.minimap.default
        : 0;
      return s;
    });
  });

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

  $: handleGridLayoutShift($runtime.layoutOffset);

  function handleGridLayoutShift(vector) {
    if (vector.x === 0 && vector.y === 0) {
      return;
    }

    handleResize();
  }
</script>

<svelte:window on:resize={handleResize} />

<Splitpanes theme="modern-theme" horizontal={true} class="w-full">
  <Pane size={100 - $splitpanes.minimap.size}>
    <container
      bind:this={container}
      use:Modal.TargetManager.registerAs={Modal.Snap.GridLayout}
      tabindex="-1"
      style="color: var(--foreground); background-color: var(--background);"
      class="grid grid-rows-[1fr_auto] w-full h-full"
    >
      <div
        class="relative flex flex-col w-full h-full overflow-hidden justify-center"
      >
        <ControlSurface />
        <div
          class:invisible={!showFixedStickyContainer ||
            $runtime.modules.length === 0}
        >
          <StickyContainer />
        </div>

        <div
          style="background-color: var(--background); color: var(--foreground); border: 1px solid var(--border);  border-radius: var(--radius); border-top:none;"
          class="absolute top-0 w-fit mx-auto self-center z-[1] items-center flex gap-2 min-h-24 px-4"
        >
          <ActiveChanges />
        </div>

        <GridLayout
          runtime={$runtime_manager.active.runtime}
          scale={derived(
            appSettings,
            ($appSettings) => 1 * $appSettings.persistent.size,
          )}
          bind:component={gridLayout}
          on:resize={handleResize}
          interactive={true}
          class="absolute z-[0] top-1/2 left-1/2 flex flex-col"
          style="transform: translate(calc(-50% + {$runtime.layoutOffset
            .x}px), calc(-50% + {$runtime.layoutOffset.y}px));"
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
            in:fade|global={{ duration: 1000 }}
            out:blur|global={{ duration: 150 }}
            class="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2"
          >
            <ModulConnectionDialog />
          </div>
        {/if}

        <div class="flex">
          {#if trackerVisible || true}
            <div
              in:fly|global={{ x: -10 }}
              out:fly|global={{ x: 10 }}
              class="w-full absolute right-0 bottom-0 mb-0 mr-4 pl-4 flex flex-row items-center justify-between"
            >
              <PanelToggleButton target={"minimap"} />
              <Tracker />
              <PanelToggleButton target={"right"} />
            </div>
          {/if}

          <CursorLog on:content-change={handleContentChange} />
        </div>
      </div>
    </container>
  </Pane>
  <Pane
    bind:size={$splitpanes.minimap.size}
    minSize={$splitpanes.minimap.default}
  >
    <div
      class="flex w-full h-full p-2 bg-background"
      style="border-top: 1px solid var(--border); border-top: 1px solid var(--border); border-radius: var(--radius);"
    >
      <MiniMap />
    </div>
  </Pane>
</Splitpanes>
