<script lang="ts">
  import { committed_code_store } from "./../Committed_Code.store.js";
  import { ConfigObject } from "./../../main/panels/configuration/Configuration.store.ts";
  import LineEditor from "./../../main/user-interface/LineEditor.svelte";
  import { createEventDispatcher } from "svelte";
  import { config_drag } from "../../main/_actions/move.action";
  import SvgIcon from "../../main/user-interface/SvgIcon.svelte";
  import { onMount } from "svelte";
  import { clickOutside } from "../../main/_actions/click-outside.action";

  const dispatch = createEventDispatcher();

  export let access_tree;
  export let config: ConfigObject = undefined;
  export let index;

  function handleClick(e) {
    dispatch("toggle");
  }

  function sendData(value: string) {
    dispatch("output", {
      short: config.short,
      script: config.script,
      name: value,
    });
  }

  function handleEditClicked() {
    isEdit = true;
  }

  onMount(() => {
    name =
      typeof config.name !== "undefined"
        ? config.name
        : config.information.displayName;
  });

  function handleNameChange(e) {
    const { script } = e.detail;
    name = script;
  }

  function handleClickOutside(e) {
    isEdit = false;
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

  $: if (typeof $committed_code_store !== "undefined") {
    if ($committed_code_store.index == index) {
      sendData($committed_code_store.name);
      name = $committed_code_store.name;
    }
  }

  let name: string;
  let isEdit = false;
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="justify-between gap-2 w-full h-full px-2 py-1 flex-row text-white flex items-center bg-secondary {typeof $config_drag ===
  'undefined'
    ? 'group-hover/bg-color:bg-select-saturate-10'
    : ''}"
  on:click={handleClick}
>
  {#if isEdit}
    <div
      class="bg-primary font-normal my-auto rounded flex items-center flex-grow h-full"
      on:click|stopPropagation
      use:clickOutside={{ useCapture: true }}
      on:click-outside={handleClickOutside}
    >
      <LineEditor {access_tree} value={name} on:output={handleNameChange} />
    </div>
  {:else}
    <span>{name}</span>
  {/if}
  <button
    on:click|stopPropagation={handleEditClicked}
    class="cursor-pointer pointer-events-auto"
  >
    <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
  </button>
</div>
