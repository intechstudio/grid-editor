<script>
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import Options from "./Options.svelte";
  import { createEventDispatcher } from "svelte";
  import { configManager } from "../Configuration.store";
  import {
    appActionClipboard,
    controlElementClipboard,
  } from "../../../../runtime/runtime.store";
  import MoltenPushButton, {
    ButtonRatio,
  } from "../../preferences/MoltenPushButton.svelte";

  import MoltenPopup from "../../preferences/MoltenPopup.svelte";

  const dispatch = createEventDispatcher();

  let isSelection = false;
  let clipboardEmpty = true;
  let selectAllChecked = false;

  $: clipboardEmpty = $appActionClipboard.length == 0;

  $: {
    selectAllChecked =
      typeof $configManager.find((e) => !e.selected) === "undefined" &&
      $configManager.length > 0;
  }

  $: {
    isSelection = typeof $configManager.find((e) => e.selected) !== "undefined";
  }

  function handleConvertToCodeBlockClicked(e) {
    dispatch("convert-to-code-block", {
      configs: $configManager.filter((e) => e.selected),
      index: $configManager.findIndex((e) => e.selected), //First selected
    });
  }

  function handleCutClicked(e) {
    dispatch("cut");
  }

  function handleCopyClicked(e) {
    dispatch("copy");
  }

  function handlePasteClicked(e) {
    dispatch("paste", { index: undefined });
  }

  function handleRemoveClicked(e) {
    dispatch("remove");
  }

  function handleSelectAllClicked(e) {
    const allSelected =
      typeof $configManager.find((e) => e.selected == false) === "undefined";
    configManager.update((s) => {
      s.forEach((e) => {
        if (isSelection) {
          if (allSelected) {
            e.selected = false;
          } else {
            e.selected = true;
          }
        } else {
          e.selected = true;
        }
      });
      return s;
    });
  }

  function handleCopyAll(e) {
    dispatch("copy-all");
  }

  function handleOverwriteAll(e) {
    dispatch("overwrite-all");
  }
</script>

<app-action-multi-select class="w-full flex flex-col gap-2">
  <div class="flex flex-row gap-1 text-gray-400">
    <MoltenPushButton on:click={handleCopyAll} ratio={ButtonRatio.BOX}>
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm">Copy Element</span>
        <SvgIcon displayMode="button" iconPath={"copy_all"} />
      </div>
    </MoltenPushButton>

    <MoltenPushButton
      on:click={handleOverwriteAll}
      ratio={ButtonRatio.BOX}
      disabled={typeof $controlElementClipboard === "undefined"}
    >
      <MoltenPopup slot="popup" text="Pasted!" spaceAway={15} />
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm"
          >Overwrite Element</span
        >
        <SvgIcon
          slot="content"
          class={typeof $controlElementClipboard === "undefined"
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"paste_all"}
        />
      </div>
    </MoltenPushButton>
  </div>
  <!-- When any of the array elements is true -->
  <div class="flex flex-row flex-wrap gap-2 w-full">
    <MoltenPushButton
      on:click={handleConvertToCodeBlockClicked}
      disabled={!isSelection}
      ratio={ButtonRatio.BOX}
    >
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm">Codify</span>
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"merge_as_code"}
        />
      </div>
    </MoltenPushButton>

    <MoltenPushButton
      on:click={handleCutClicked}
      disabled={!isSelection}
      ratio={ButtonRatio.BOX}
    >
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm">Cut</span>
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"cut"}
        />
      </div>
    </MoltenPushButton>

    <MoltenPushButton
      on:click={handleCopyClicked}
      disabled={!isSelection}
      ratio={ButtonRatio.BOX}
    >
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm">Copy</span>
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"copy"}
        />
      </div>
    </MoltenPushButton>

    <MoltenPushButton
      on:click={handlePasteClicked}
      disabled={clipboardEmpty}
      ratio={ButtonRatio.BOX}
    >
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm">Paste</span>
        <SvgIcon
          class={clipboardEmpty
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"paste"}
        />
      </div>
    </MoltenPushButton>

    <MoltenPushButton
      on:click={handleRemoveClicked}
      disabled={!isSelection}
      ratio={ButtonRatio.BOX}
    >
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm">Remove</span>
        <SvgIcon
          class={!isSelection
            ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
            : ""}
          iconPath={"remove"}
        />
      </div>
    </MoltenPushButton>

    <div class="flex items-center ml-auto">
      <Options
        bind:selected={selectAllChecked}
        halfSelected={isSelection}
        on:selection-change={handleSelectAllClicked}
      />
    </div>
  </div>
</app-action-multi-select>

<style>
</style>
