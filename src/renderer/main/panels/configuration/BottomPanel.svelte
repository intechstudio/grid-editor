<script lang="ts">
  import { isPasteActionsEnabled } from "./components/Toolbar";
  import { GridEvent } from "./../../../runtime/runtime";
  import ActionPicker from "./components/ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";
  import ExportButton from "./components/ExportButton.svelte";
  import AddActionButton from "./components/AddActionButton.svelte";
  import { appSettings } from "../../../runtime/app-helper.store";

  export let target: { event: GridEvent; index: number };

  const dispatch = createEventDispatcher();

  function handlePaste(e: any) {
    const { index } = e.detail;
    dispatch("paste", { index: index });
  }

  function handleNewConfig(e) {
    dispatch("new-config", e.detail);
  }
</script>

<div class="w-full grid grid-cols-[1fr_auto_auto] gap-2">
  <AddActionButton
    {target}
    on:new-config={handleNewConfig}
    on:paste={handlePaste}
  />
  {#if $appSettings.isMultiView}
    <button
      class="flex rounded px-3 py-1 bg-commit items-center justify-center"
      class:opacity-50={!$isPasteActionsEnabled}
      on:click={() => handlePaste(target.index)}
      disabled={!$isPasteActionsEnabled}
    >
      <span class="text-white"> Paste </span>
    </button>
  {/if}

  {#if !$appSettings.isMultiView}
    <ExportButton />
  {/if}
</div>
