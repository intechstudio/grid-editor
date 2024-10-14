<script lang="ts">
  import {
    appClipboard,
    ClipboardKey,
  } from "./../../../../runtime/clipboard.store";
  import { fade } from "svelte/transition";
  import ActionPicker from "./ActionPicker.svelte";
  import { createEventDispatcher } from "svelte";

  let showActionPicker = false;
  let referenceElement = undefined;
  let isButtonHovered = false;
  let pasteDisabled = $appClipboard?.key !== ClipboardKey.ACTION_BLOCKS;

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

  function handlePaste(index: number) {
    dispatch("paste", { index: index });
  }
</script>

<container
  class="{$$props.class} relative"
  bind:this={referenceElement}
  on:new-config={handleNewConfig}
  on:paste={(e) => handlePaste(e.detail.index)}
>
  <div
    id="background-with-text"
    class="text-white/50 grid grid-cols-[1fr_auto] py-2 my-1 px-5 mr-4 justify-between items-center gap-2"
    class:hover-bg={isButtonHovered}
    in:fade={{ delay: 200 }}
  >
    <span class="text-start">{text}</span>
    <div class="flex flex-row gap-2">
      <button
        class="flex rounded px-3 py-1 bg-commit items-center"
        class:opacity-50={pasteDisabled}
        on:click={() => handlePaste(index)}
        on:mouseenter={() => (isButtonHovered = true)}
        on:mouseleave={() => (isButtonHovered = false)}
        disabled={pasteDisabled}
      >
        <span class="text-white"> Paste </span>
      </button>
      <button
        class="rounded px-2 py-1 border border-pick group-hover:bg-pick/40"
        on:click={handleShowActionPicker}
        on:mouseenter={() => (isButtonHovered = true)}
        on:mouseleave={() => (isButtonHovered = false)}
      >
        <div class="flex flex-row items-center gap-2 text-white">
          <span> Add </span>
          <span class="text-2xl">+</span>
        </div>
      </button>
    </div>
  </div>
</container>

{#if showActionPicker}
  <ActionPicker {index} {referenceElement} on:close={handleCloseActionPicker} />
{/if}

<style>
  .hover-bg {
    background-color: rgba(255, 255, 255, 0.1);
  }
</style>
