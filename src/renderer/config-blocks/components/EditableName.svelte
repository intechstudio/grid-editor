<script lang="ts">
  import { MoltenInput } from "@intechstudio/grid-uikit";
  import { createEventDispatcher, onMount } from "svelte";
  import { tick } from "svelte";

  const dispatch = createEventDispatcher();

  export let isEdit = false;
  export let value: string | undefined;
  export let availableCharacters: number;
  export let defaultValue: string;

  let editValue: string;
  let input: MoltenInput;

  $: handleValueChange(value);

  $: {
    if (isEdit) {
      handleEditChange();
    }
  }

  function handleValueChange(value: string | undefined) {
    editValue = value ?? "";
  }

  function handleNameInput(e: any) {
    const { value } = e.detail;
    editValue = value;
  }

  function handleNameChange() {
    isEdit = false;
    if (editValue !== value) {
      const next = editValue.length > 0 ? editValue : undefined;
      value = next;
      dispatch("name-change", { value: next });
    }
  }

  function handleBlur() {
    isEdit = false;
  }

  async function handleEditChange() {
    await tick();
    input.focus();
  }

  function handleInputKeyDown(e: any) {
    const { key } = e.detail;

    if (isEdit && key === "Enter") {
      isEdit = false;
    }
  }
</script>

{#if isEdit}
  <div class="pointer-events-auto w-full">
    <MoltenInput
      bind:this={input}
      target={editValue}
      on:input={handleNameInput}
      on:change={handleNameChange}
      on:keydown={handleInputKeyDown}
      on:blur={handleBlur}
      {availableCharacters}
    />
  </div>
{:else}
  <span class="truncate">
    {editValue.length === 0 ? defaultValue : value}
  </span>
{/if}
