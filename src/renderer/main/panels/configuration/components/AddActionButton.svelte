<script lang="ts">
  import { GridEvent } from "../../../../runtime/runtime";
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  interface Props {
    target: { event: GridEvent; index: number };
  }

  let { target }: Props = $props();

  let showActionPicker = $state(false);
  let referenceElement = $state(undefined);

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
    onclick={handleShowActionPicker}
    class="cursor-pointer flex w-full truncate hover:border-pick border-l-foreground hover:bg-background-muted
                transition-colors duration-300 border-l-4 pl-4 p-2"
  >
    Add action block...
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
