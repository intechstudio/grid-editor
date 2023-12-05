<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { appSettings } from "/runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";

  export let device = undefined;
  export let visible = false;

  const dispatch = createEventDispatcher();

  function handleLoadClicked(e) {
    dispatch("load");
  }

  function cancelProfileOverlay() {
    selectedConfigStore.set({});
    $appSettings.displayedOverlay = undefined;
  }
</script>

{#if visible && device?.type === $selectedConfigStore.type}
  <div
    class="text-white w-full flex flex-col
    items-center justify-center rounded h-full absolute pointer-events-auto bg-overlay"
    style="transform: rotate({-$appSettings.persistent.moduleRotation +
      90 * device?.rot}deg); border-radius: var(--grid-rounding);"
  >
    <div class="w-fit relative">
      <button
        on:click={handleLoadClicked}
        class="px-4 py-2 rounded bg-commit hover:bg-commit-saturate-20
        block"
      >
        Load Profile
      </button>
    </div>

    <div class="w-fit">
      <button
        class="bg-select px-4 py-1 rounded hover:bg-select-saturate-20
        left-[37%] absolute bottom-[22%]"
        on:click={() => {
          cancelProfileOverlay();
        }}
      >
        Cancel
      </button>
    </div>
  </div>
{/if}
