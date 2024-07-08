<script>
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { fade } from "svelte/transition";
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  let showActionPicker = false;
  let referenceElement = undefined;

  export let index = undefined;
  export let text;

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

<container
  class="{$$props.class} relative"
  bind:this={referenceElement}
  on:new-config={handleNewConfig}
  on:paste={handlePaste}
>
  <button
    class="text-white/50 flex flex-row py-2 my-1 px-5 mr-4 justify-between items-center gap-2 group hover:bg-white/10"
    in:fade={{ delay: 200 }}
    on:click={handleShowActionPicker}
  >
    <span class="text-start">{text}</span>
    <div class="rounded px-2 py-1 border border-pick group-hover:bg-pick/40">
      <div class="flex flex-row items-center gap-2 text-white">
        <span> Add </span>
        <span class="text-2xl">+</span>
      </div>
    </div>
  </button>
</container>

{#if showActionPicker}
  <ActionPicker {index} {referenceElement} on:close={handleCloseActionPicker} />
{/if}
