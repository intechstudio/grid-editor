<script lang="ts">
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import GridLayout from "./GridLayout.svelte";
  import { slide } from "svelte/transition";
  import { MiniMap } from "./MiniMap";
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import PanelToggleButton from "../PanelToggleButton.svelte";

  export let toggled = false;

  let data = MiniMap.data;

  function handleToggle() {
    toggled = !toggled;
  }
</script>

<container
  class="relative flex flex-row w-full border-t-black border-t bg-primary"
>
  <div
    class="absolute top-0 right-0 mx-2"
    style="transform: translateY(calc(-100% - 0.5rem));"
  >
    <PanelToggleButton
      value={false}
      direction={"down"}
      on:toggle={handleToggle}
    />
  </div>

  {#if toggled}
    <div class="flex w-full" transition:slide={{ duration: 200 }}>
      {#each $data as entry (entry.runtime.id)}
        <button
          class="flex flex-col gap-2 bg-black bg-opacity-25 px-4 pb-4 pt-2 m-4 cursor-pointer rounded border-2 {entry
            .runtime.id === $runtime_manager.active.runtime.id
            ? 'border-white/30'
            : 'border-transparent'}"
          on:click={() => MiniMap.selectRuntime(entry.runtime.id)}
        >
          <span class="text-white">{entry.label}</span>
          <div class="pointer-events-none">
            <GridLayout
              runtime={entry.runtime}
              scale={entry.scale}
              interactive={false}
            />
          </div>
        </button>
      {/each}
    </div>
  {/if}
</container>
