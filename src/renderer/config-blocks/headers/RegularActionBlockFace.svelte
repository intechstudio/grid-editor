<script lang="ts">
  import { appSettings } from "./../../runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";
  import { SvgIcon, MoltenInput } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  import { GridAction, GridEvent } from "../../runtime/runtime";
  import { get } from "svelte/store";
  import { selected_actions } from "../../runtime/selected-actions.store";

  const dispatch = createEventDispatcher();

  export let config: GridAction;
  let event = config.parent as GridEvent;

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
    if (e.key === "F2" && get(selected_actions).includes(config)) {
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

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  role="button"
  tabindex="0"
  class="justify-between gap-2 w-full px-2 py-1 flex-row text-white flex items-center bg-secondary overflow-hidden pointer-events-auto"
  on:click={handleClick}
>
  {#if isEdit}
    <MoltenInput
      target={name}
      on:input={handleNameInput}
      on:change={handleNameChange}
      availableCharacters={$event.getAvailableChars()}
    />
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
      class="cursor-pointer hover:bg-black/25 flex w-fit h-fit p-1.5 rounded"
    >
      <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
    </button>
  {/if}
</div>
