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

<div class="w-full flex flex-row items-center">
  <AddActionButton
    {target}
    on:new-config={handleNewConfig}
    on:paste={handlePaste}
  />
  {#if $appSettings.persistent.userLevelMinimalist == false}
    <ExportButton />
  {/if}
</div>
