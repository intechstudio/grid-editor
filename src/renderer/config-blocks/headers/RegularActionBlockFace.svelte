<script lang="ts">
  import { appSettings } from "./../../runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";
  import { SvgIcon, MoltenInput } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  import { GridAction } from "../../runtime/runtime";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  function handleClick(e) {
    dispatch("toggle");
  }

  function sendData(value: string) {
    dispatch("update-action", {
      short: config.short,
      script: config.script,
      name: value,
      validationError: false,
    });
  }

  function handleEditClicked() {
    if (nameChange) {
      nameChange = false;
    } else {
      isEdit = !isEdit;
    }
  }

  onMount(() => {
    name =
      typeof config.name !== "undefined"
        ? config.name
        : config.information.displayName;
  });

  function handleNameInput(e: any) {
    const { value } = e.detail;
    name = value;
    sendData(name);
  }

  function handleNameChange(e) {
    isEdit = false;
    nameChange = true;
    dispatch("sync");
  }

  function handleKeyDown(e) {
    if (e.key === "F2" && config.selected) {
      isEdit = true;
    }

    if (isEdit && e.key === "Enter") {
      isEdit = false;
      sendData(name);
    }
  }

  let name: string;
  let isEdit = false;
  let nameChange = false;
</script>

<svelte:window on:keydown={handleKeyDown} />

<button
  class="justify-between gap-2 w-full px-2 py-1 flex-row text-white flex items-center bg-secondary overflow-hidden"
  on:click={handleClick}
>
  {#if isEdit}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="bg-primary font-normal my-auto rounded flex items-center flex-grow h-full pointer-events-auto"
      on:click|stopPropagation
    >
      <MoltenInput
        target={name}
        on:input={handleNameInput}
        on:change={handleNameChange}
        availableCharacters={$config.parent.getAvailableChars()}
      />
    </div>
  {:else}
    <div class="w-0 flex-grow min-w-0 items-start text-left">
      <span class="truncate block">
        {typeof $config?.name === "undefined"
          ? config.information.displayName
          : $config.name}
      </span>
    </div>
  {/if}

  {#if $appSettings.persistent.editableBlockNames}
    <button
      on:click|stopPropagation={handleEditClicked}
      class="cursor-pointer pointer-events-auto hover:bg-black/25 flex w-fit h-fit p-1.5 rounded"
    >
      <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
    </button>
  {/if}
</button>
