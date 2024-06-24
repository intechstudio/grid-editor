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
  <div
    class="text-white/50 flex flex-row py-3 px-5 justify-between items-center gap-2"
    in:fade={{ delay: 200 }}
  >
    <span>{text}</span>
    <MoltenPushButton style={"outlined"} click={handleShowActionPicker}>
      <div slot="content" class="flex flex-row items-center gap-2">
        <span> Add </span>
        <span class="text-2xl">+</span>
      </div>
    </MoltenPushButton>
  </div>
</container>

{#if showActionPicker}
  <ActionPicker {index} {referenceElement} on:close={handleCloseActionPicker} />
{/if}
