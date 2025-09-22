<script lang="ts">
  import { appSettings } from "./../../runtime/app-helper.store";
  import { createEventDispatcher } from "svelte";
  import { SvgIcon, MoltenInput } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";
  import { GridAction, GridEvent } from "../../runtime/runtime";
  import { derived, get } from "svelte/store";
  import { selected_actions } from "../../runtime/selected-actions.store";
  import { SimpleColor } from "../SimpleColor";

  const dispatch = createEventDispatcher();

  export let config: GridAction;
  let event = config.parent as GridEvent;

  const data = new SimpleColor.ViewModel(config);

  const cssColors = derived(data, ($data) => {
    const css = $data.previewColors.map((e) =>
      Object.values(e).some((e) => isNaN(Number(e)))
        ? "white"
        : `rgba(${e.red},${e.green},${e.blue},${e.alpha})`,
    );
    return css.length === 1 ? ["transparent", ...css] : css;
  });

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
  class="w-full gap-2 px-2 py-1 items-center justify-between overflow-hidden pointer-events-none bg-background-muted"
  style="display: grid; grid-template-columns: minmax(0, 33%) 1fr auto;"
  on:click={handleClick}
>
  <div class="flex h-full items-center">
    {#if isEdit}
      <div class="pointer-events-auto w-full">
        <MoltenInput
          target={name}
          on:input={handleNameInput}
          on:change={handleNameChange}
          availableCharacters={$event.getAvailableChars()}
        />
      </div>
    {:else}
      <span class="truncate">
        {typeof $config?.name === "undefined"
          ? config.information.displayName
          : $config.name}
      </span>
    {/if}
  </div>

  <div class="flex-grow h-full py-1">
    <div
      class="h-full w-full rounded-full border border-black will-change-transform"
      style="background-image: linear-gradient(to right, {$cssColors.join(
        ',',
      )}); background-size: 100% 100%; background-repeat: no-repeat;"
    />
  </div>

  {#if $appSettings.persistent.editableBlockNames}
    <button
      on:click|stopPropagation={handleEditClicked}
      class="cursor-pointer hover:bg-black/25 flex w-fit h-fit p-1.5 rounded pointer-events-auto"
    >
      <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
    </button>
  {/if}
</div>
