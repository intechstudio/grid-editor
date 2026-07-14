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
  function handlePaste(e: any) {
    const { index } = e.detail;
    dispatch("paste", { index: index });
  }
</script>

<container>
  <button
    bind:this={referenceElement}
    on:click={handleShowActionPicker}
    style="border-color: var(--foreground-muted); color: var(--foreground);"
    class="cursor-pointer flex w-full items-center justify-center gap-3 border border-dashed px-4 py-4 mx-2 my-2 w-[calc(100%-1rem)]
           hover:bg-background-muted hover:brightness-125 transition-all duration-200 text-base font-medium"
  >
    <span class="text-2xl leading-none">+</span>
    <span>Add action block</span>
  </button>

  {#if showActionPicker}
    <ActionPicker
      event={target.event}
      index={target.index}
      {referenceElement}
      on:close={handleCloseActionPicker}
      on:new-config={handleNewConfig}
      on:paste={handlePaste}
    />
  {/if}
</container>
