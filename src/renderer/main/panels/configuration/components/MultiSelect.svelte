<script>
  import { setTooltip } from "./../../../user-interface/tooltip/Tooltip.ts";
  import SvgIcon from "../../../user-interface/SvgIcon.svelte";
  import Options from "./Options.svelte";
  import { createEventDispatcher } from "svelte";
  import { configManager } from "../Configuration.store";
  import { appActionClipboard } from "../../../../runtime/runtime.store";
  import MoltenPushButton, {
    ButtonRatio,
  } from "../../preferences/MoltenPushButton.svelte";

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
</script>

<app-action-multi-select class=" flex items-center flex-row">
  <!-- When any of the array elements is true -->
  <div class="w-fit flex flex-wrap flex-row gap-1">
    <MoltenPushButton
      on:click={handleConvertToCodeBlockClicked}
      disabled={!isSelection}
      ratio={ButtonRatio.BOX}
    >
      <div slot="content" class="flex flex-row gap-2 items-center">
        <span class=" text-white text-opacity-75 text-sm">Merge as Code</span>
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

    <Options
      bind:selected={selectAllChecked}
      on:selection-change={handleSelectAllClicked}
    />
  </div>
</app-action-multi-select>

<style>
</style>
