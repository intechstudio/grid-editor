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

  function handleNameChange(e) {
    const { value } = e.detail;
    name = value;
    //isEdit = false;
    nameChange = true;
    console.log(name)
    sendData(name);
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

  $: console.log(isEdit)
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="justify-between gap-2 w-full px-2 py-1 flex-row text-white flex items-center bg-secondary"
  on:click={handleClick}
>
  {#if isEdit}
    <div
      class="bg-primary font-normal my-auto rounded flex items-center flex-grow h-full pointer-events-auto"
      on:click|stopPropagation
    >
      <MoltenInput
        target={name}
        on:input={handleNameChange}
        on:change={() => dispatch("sync")}
        availableCharacters={$config.parent.getAvailableChars()}
      />
    </div>
  {:else}
    <span class="truncate"
      >{typeof $config?.name === "undefined"
        ? config.information.displayName
        : $config.name}</span
    >
  {/if}

  {#if $appSettings.persistent.editableBlockNames}
    <button
      on:click|stopPropagation={handleEditClicked}
      class="cursor-pointer pointer-events-auto"
    >
      <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
    </button>
  {/if}
</div>
