<script lang="ts">
  import { GridEvent } from "../../../../runtime/runtime";
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  export let target: { event: GridEvent; index: number };

  let showActionPicker = false;
  let referenceElement = undefined;

  const dispatch = createEventDispatcher();

  function handleNewConfig(e) {
    dispatch("new-config", e.detail);
  }
  function handleShowActionPicker(e) {
    showActionPicker = true;
  }
  function handleCloseActionPicker(e) {
    showActionPicker = false;
  }
  function handlePaste(e) {
    dispatch("paste", e.detail);
  }
</script>

<container>
  <button
    bind:this={referenceElement}
    on:click={handleShowActionPicker}
    on:new-config={handleNewConfig}
    on:paste={handlePaste}
    class="cursor-pointer flex w-full truncate hover:border-pick hover:bg-select-saturate-10 border-secondary
                transition-colors duration-300 border-l-4 text-white pl-4 p-2"
  >
    Add action block...
  </button>

  {#if showActionPicker}
    <ActionPicker
      event={target.event}
      index={target.index}
      {referenceElement}
      on:close={handleCloseActionPicker}
    />
  {/if}
</container>
