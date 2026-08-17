<script lang="ts">
  import { GridEvent } from "../../../../runtime/runtime";
  import ActionPicker from "./ActionPicker.svelte";
  import { Modal } from "../../../modals/modal.store";
  import { createEventDispatcher } from "svelte";

  export let target: { event: GridEvent; index: number };

  let referenceElement: HTMLElement;

  const dispatch = createEventDispatcher();

  function handleNewConfig(payload) {
    dispatch("new-config", payload);
  }
  function handleShowActionPicker(e) {
    new Modal.Window(ActionPicker, Modal.Snap.Full).show({
      event: target.event,
      index: target.index,
      anchorElement: referenceElement,
      onNewConfig: handleNewConfig,
      onPaste: handlePaste,
    });
  }
  function handlePaste(payload) {
    dispatch("paste", { index: payload.index });
  }
</script>

<button
  bind:this={referenceElement}
  on:click={handleShowActionPicker}
  style="border-color: var(--foreground-muted); color: var(--foreground);"
  class="cursor-pointer flex w-full items-center justify-center gap-3 border border-dashed px-4 py-4 mx-2 my-2 w-[calc(100%-1rem)]
           hover:bg-background-muted hover:brightness-125 transition-all duration-200"
  data-testid="add-action-button"
>
  <span class=" leading-none" style="font-size: 1.3em;">+</span>
  <span style="font-size: 1em;">Add action block</span>
</button>
