<script lang="ts">
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import GridLayout from "./GridLayout.svelte";
  import { slide } from "svelte/transition";
  import { MiniMap } from "./MiniMap";
  import AddButton from "../user-interface/AddButton.svelte";
  import MoltenIconButton from "../user-interface/MoltenIconButton.svelte";
  import { GridRuntime } from "../../runtime/runtime";
  import { Grid } from "../../lib/_utils";
  import { writable } from "svelte/store";
  import { appSettings } from "../../runtime/app-helper.store";

  let data = MiniMap.data;

  function handleDestroyRuntime(runtime: GridRuntime) {
    runtime_manager.destroy(runtime);
  }

  function handleAddRuntime() {
    const virtual = runtime_manager.createVirtual();
    runtime_manager.add(virtual);
    runtime_manager.setActive(virtual.id);
  }

  function handleRotateRuntime(runtime: GridRuntime) {
    runtime.rotation = Grid.addRotations(runtime.rotation, Grid.Rotation.R90);
  }

  const heights = writable(new Map<string, number>());

  function observeHeight(node: HTMLElement, id: string) {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        requestAnimationFrame(() => {
          heights.update((h) => {
            h.set(id, entry.contentRect.height);
            return h;
          });
        });
      }
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
</script>

<container
  transition:slide={{ duration: 200 }}
  class="flex h-full w-full overflow-x-auto overflow-y-clip"
>
  <div class="flex h-full flex-row items-center gap-4 p-4">
    {#each $data as entry (entry.runtime.id)}
      <button
        class="grid grid-rows-[auto_1fr] h-full shrink-0 gap-2 px-4 pb-4 pt-2 bg-black bg-opacity-25 cursor-pointer rounded border-2 {entry
          .runtime.id === $runtime_manager.active.runtime.id
          ? 'border-white/30'
          : 'border-transparent'} "
        on:click={() => MiniMap.selectRuntime(entry.runtime.id)}
        style:min-width={"100px"}
      >
        <div class="flex flex-row justify-between items-center w-full">
          <span class="text-white">{entry.label}</span>
          <div class="flex flex-row ml-2">
            <MoltenIconButton
              on:click={() => {
                handleRotateRuntime(entry.runtime);
              }}
              iconPath={"rotate"}
            />

            {#if entry.runtime.virtual && $data.length > 1}
              <MoltenIconButton
                on:click={() => {
                  handleDestroyRuntime(entry.runtime);
                }}
                iconPath={"close"}
              />
            {/if}
          </div>
        </div>
        <div
          class="pointer-events-none relative h-full"
          style:width={`max(${MiniMap.calculateWidth(entry, $heights.get(entry.runtime.id), $appSettings.persistent.moduleRotation)}px, 100px)`}
          use:observeHeight={entry.runtime.id}
        >
          <div
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <GridLayout
              runtime={entry.runtime}
              scale={MiniMap.calculateScale(
                entry,
                $heights.get(entry.runtime.id),
                $appSettings.persistent.moduleRotation,
              )}
              interactive={false}
            />
          </div>
        </div>
      </button>
    {/each}
    <div class="flex h-full w-fit">
      <AddButton on:click={handleAddRuntime} />
    </div>
  </div>
</container>
