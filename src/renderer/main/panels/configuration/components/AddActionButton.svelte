<script>
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  export let index = undefined;
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<action-placeholder
  bind:this={referenceElement}
  on:click={handleShowActionPicker}
  on:new-config={handleNewConfig}
  on:paste={handlePaste}
  class="cursor-pointer flex w-full items-center"
>
  <div
    class="hover:border-pick hover:bg-select-saturate-10 border-secondary
              transition-colors duration-300 w-full border-l-4 text-white pl-4 p-2"
  >
    Add action block...
  </div>
</action-placeholder>

{#if showActionPicker}
  <ActionPicker {index} {referenceElement} on:close={handleCloseActionPicker} />
{/if}
