<script lang="ts">
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import GridLayout from "./GridLayout.svelte";
  import { slide } from "svelte/transition";
  import { MiniMap } from "./MiniMap";
  import AddButton from "../user-interface/AddButton.svelte";
  import MoltenIconButton from "../user-interface/MoltenIconButton.svelte";
  import { GridRuntime } from "../../runtime/runtime";
  import { Grid } from "../../lib/_utils";

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
</script>

<container class="relative flex flex-row w-full h-full bg-background">
  <div
    class="flex w-full h-fit items-center flex-row"
    transition:slide={{ duration: 200 }}
  >
    {#each $data as entry (entry.runtime.id)}
      <button
        class="flex flex-col gap-2 bg-black bg-opacity-25 px-4 pb-4 pt-2 m-4 cursor-pointer rounded border-2 {entry
          .runtime.id === $runtime_manager.active.runtime.id
          ? 'border-white/30'
          : 'border-transparent'}"
        onclick={() => MiniMap.selectRuntime(entry.runtime.id)}
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

            {#if entry.runtime.virtual}
              <MoltenIconButton
                on:click={() => {
                  handleDestroyRuntime(entry.runtime);
                }}
                iconPath={"close"}
              />
            {/if}
          </div>
        </div>
        <div class="pointer-events-none">
          <GridLayout
            runtime={entry.runtime}
            scale={entry.scale}
            interactive={false}
          />
        </div>
      </button>
    {/each}
    <div class="flex h-full w-fit">
      <AddButton on:click={handleAddRuntime} />
    </div>
  </div>
</container>
