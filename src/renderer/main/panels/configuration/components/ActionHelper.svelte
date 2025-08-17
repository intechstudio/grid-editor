<script lang="ts">
  import {
    appClipboard,
    ClipboardKey,
  } from "./../../../../runtime/clipboard.store";
  import { fade } from "svelte/transition";
  import ActionPicker from "./ActionPicker.svelte";
  import { GridEvent } from "../../../../runtime/runtime";
  import { addActions, pasteActions } from "../../../../runtime/operations";
  import { isPasteActionsEnabled } from "./Toolbar";

  let showActionPicker = $state(false);
  let referenceElement = $state(undefined);

  interface Props {
    text: string;
    target: { event: GridEvent; index: number };
  }

  let { text, target }: Props = $props();

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
</script>

<container bind:this={referenceElement} class="relativ flex w-full">
  <div
    class="w-full grid grid-cols-[1fr_auto] py-2 my-4 px-5 justify-between items-center gap-2 bg-background-muted"
  >
    <span class="text-start line-clamp-3 flex-grow">{text}</span>
    <div class="flex flex-row gap-2">
      <button
        class="flex rounded px-3 py-1 bg-commit items-center"
        class:opacity-50={!$isPasteActionsEnabled}
        onclick={(e) => handlePaste({ detail: { index: target.index } })}
        disabled={!$isPasteActionsEnabled}
      >
        <span> Paste </span>
      </button>
      <button
        class="rounded px-2 py-1 border border-pick group-hover:bg-pick/40"
        onclick={handleShowActionPicker}
      >
        <div class="flex flex-row items-center gap-2">
          <span> Add </span>
          <span class="text-2xl">+</span>
        </div>
      </button>
    </div>
  </div>

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
