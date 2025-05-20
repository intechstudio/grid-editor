<script lang="ts">
  import { runtime_manager } from "../../runtime/runtime-manager.store";
  import GridLayout from "./GridLayout.svelte";
  import { slide } from "svelte/transition";
  import { MiniMap } from "./MiniMap";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  export let toggled = false;
  export let visible = true;

  let data = MiniMap.data;
  let connectionCount = 0;

  function handleToggle() {
    toggled = !toggled;
  }

  onMount(() => {
    connectionCount = get(data).length;
  });

  $: if (connectionCount != $data.length) {
    toggled = true;
  }
</script>

<container
  class="relative flex flex-row w-full border-t-black border-t bg-primary"
  class:hidden={!visible}
>
  <button
    class="absolute top-0 right-0 bg-primary rotate -translate-y-full w-10 h-7 p-2 mx-2 rounded-t fill-gray-500 border-x border-x-black border-t border-t-black"
    on:click={handleToggle}
  >
    <div class="flex w-full h-full" class:rotate-180={toggled}>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 75 330 180"
      >
        <path
          d="M325.606,229.393l-150.004-150C172.79,76.58,168.974,75,164.996,75c-3.979,0-7.794,1.581-10.607,4.394
            l-149.996,150c-5.858,5.858-5.858,15.355,0,21.213c5.857,5.857,15.355,5.858,21.213,0l139.39-139.393l139.397,139.393
            C307.322,253.536,311.161,255,315,255c3.839,0,7.678-1.464,10.607-4.394C331.464,244.748,331.464,235.251,325.606,229.393z"
        />
      </svg>
    </div>
  </button>

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
