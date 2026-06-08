<script lang="ts">
  import {
    appClipboard,
    ClipboardKey,
  } from "./../../../../runtime/clipboard.store";
  import { fade } from "svelte/transition";
  import ActionPicker from "./ActionPicker.svelte";
  import {
    GridEvent,
    GridAction,
    ActionData,
  } from "../../../../runtime/runtime";
  import { addActions, pasteActions } from "../../../../runtime/operations";
  import { isPasteActionsEnabled } from "./Toolbar";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import Indentation from "./Indentation.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  let showActionPicker = false;
  let referenceElement = undefined;

  export let text: string;
  export let target: { event: GridEvent; index: number };
  export let indentation: number = 0;

  function handleShowActionPicker(e) {
    showActionPicker = true;
  }

  function handleCloseActionPicker(e) {
    showActionPicker = false;
  }

  function handleNewConfig(e: any) {
    const { configs, index } = e.detail;
    addActions(target.event, index, ...configs);
  }

  function handlePaste(e: any) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(target.event, index);
  }

  function handleAddCodeBlock() {
    const codeBlock = new GridAction(
      undefined,
      new ActionData("cb", 'print("hello")'),
    );
    addActions(target.event, target.index, codeBlock);
  }
</script>

<container
  bind:this={referenceElement}
  class="relative flex w-full min-w-0 overflow-x-auto"
  class:pr-8={indentation > 0}
>
  <Indentation level={indentation} />
  <div class="w-full flex flex-col py-2 px-5 gap-2 bg-background-muted">
    <span class="text-start line-clamp-3">{text}</span>
    <div class="flex flex-wrap gap-2">
      <MoltenPushButton
        text="Paste"
        style="accept"
        disabled={!$isPasteActionsEnabled}
        click={() => handlePaste({ detail: { index: target.index } })}
      />
      {#if !$appSettings.persistent.userLevelMinimalist}
        <MoltenPushButton
          text="Add Code"
          style="normal"
          click={handleAddCodeBlock}
        />
      {/if}
      <MoltenPushButton
        text="Add Action"
        style="normal"
        click={handleShowActionPicker}
      />
    </div>
  </div>
</container>

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
