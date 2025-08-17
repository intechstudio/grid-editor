<script lang="ts">
  import { stopPropagation } from 'svelte/legacy';

  import { appSettings } from "./../../runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";
  import { SvgIcon, MoltenInput } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  import { GridAction, GridEvent } from "../../runtime/runtime";
  import { get } from "svelte/store";
  import { selected_actions } from "../../runtime/selected-actions.store";

  const dispatch = createEventDispatcher();

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();
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

  let name: string = $state();
  let isEdit = $state(false);
  let nameChange = false;
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  role="button"
  tabindex="0"
  class="justify-between gap-2 w-full px-2 py-1 flex-row flex items-center overflow-hidden pointer-events-none bg-background-muted"
  onclick={handleClick}
>
  {#if isEdit}
    <div class="pointer-events-auto flex flex-grow">
      <MoltenInput
        target={name}
        on:input={handleNameInput}
        on:change={handleNameChange}
        availableCharacters={$event.getAvailableChars()}
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
      onclick={stopPropagation(handleEditClicked)}
      class="cursor-pointer hover:bg-black/25 flex w-fit h-fit p-1.5 rounded pointer-events-auto"
    >
      <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
    </button>
  {/if}
</div>
