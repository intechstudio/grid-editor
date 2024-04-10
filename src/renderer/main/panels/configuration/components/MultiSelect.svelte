<script>
  import MoltenToolbarButton from "./../../../user-interface/MoltenToolbarButton.svelte";
  import { ConfigTarget } from "./../Configuration.store.js";
  import { runtime, user_input } from "./../../../../runtime/runtime.store.js";
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
    ButtonStyle,
  } from "../../preferences/MoltenPushButton.svelte";

  import MoltenPopup from "../../preferences/MoltenPopup.svelte";
  import { get } from "svelte/store";

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

  function handleDiscard(e) {
    dispatch("discard");
  }

  let discardElementEnabled = false;

  function handleCalculateDiscardEnabled(rt, ui) {
    const target = ConfigTarget.createFrom({
      userInput: ui,
    });
    discardElementEnabled = target?.hasChanges() ?? true;
  }

  $: handleCalculateDiscardEnabled($runtime, $user_input);

  let selectedAction = undefined;

  function handleToolbarButtonHover(buttonText) {
    selectedAction = buttonText;
  }

  function handleToolbarButtonBlur() {
    selectedAction = undefined;
  }
</script>

<app-action-multi-select class="w-full flex flex-row justify-between -mb-2">
  <!-- When any of the array elements is true -->
  <div class="flex flex-col w-full text-white">
    <span class="text-gray-500 text-sm">Action: </span>
    <span
      class="text-sm"
      class:invisible={typeof selectedAction === "undefined"}
      >{selectedAction}</span
    >
  </div>
  <div class="flex flex-col flex-wrap w-full items-end">
    <div class="flex flex-row">
      <MoltenToolbarButton
        on:click={handleCopyAll}
        on:mouseenter={() => handleToolbarButtonHover("Copy Element")}
        on:mouseleave={handleToolbarButtonBlur}
        iconPath={"copy_all"}
        color={"#03cb00"}
      />

      <MoltenToolbarButton
        on:click={handleOverwriteAll}
        on:mouseenter={() => handleToolbarButtonHover("Overwrite Element")}
        on:mouseleave={handleToolbarButtonBlur}
        iconPath={"paste_all"}
        disabled={typeof $controlElementClipboard === "undefined"}
        color={"#006cb7"}
      />

      <MoltenToolbarButton
        on:click={handleDiscard}
        on:mouseenter={() =>
          handleToolbarButtonHover("Discard Element Changes")}
        on:mouseleave={handleToolbarButtonBlur}
        iconPath={"clear_from_device_01"}
        disabled={!discardElementEnabled}
        color={"#ff2323"}
      />
    </div>
    <div class="flex flex-row">
      <MoltenToolbarButton
        on:click={handleCopyClicked}
        on:mouseenter={() => handleToolbarButtonHover("Copy Action(s)")}
        on:mouseleave={handleToolbarButtonBlur}
        disabled={!isSelection}
        iconPath={"copy"}
        color={"#03cb00"}
      />

      <MoltenToolbarButton
        on:click={handlePasteClicked}
        on:mouseenter={() => handleToolbarButtonHover("Paste Action(s)")}
        on:mouseleave={handleToolbarButtonBlur}
        disabled={clipboardEmpty}
        iconPath={"paste"}
        color={"#006cb7"}
      />

      <MoltenToolbarButton
        on:click={handleCutClicked}
        on:mouseenter={() => handleToolbarButtonHover("Cut Action(s)")}
        on:mouseleave={handleToolbarButtonBlur}
        disabled={!isSelection}
        iconPath={"cut"}
        color={"#ff6100"}
      />

      <MoltenToolbarButton
        on:click={handleConvertToCodeBlockClicked}
        on:mouseenter={() =>
          handleToolbarButtonHover("Merge Action(s) into Code")}
        on:mouseleave={handleToolbarButtonBlur}
        disabled={!isSelection}
        iconPath={"merge_as_code"}
        color={"#ffcc33"}
      />

      <MoltenToolbarButton
        on:click={handleRemoveClicked}
        on:mouseenter={() => handleToolbarButtonHover("Remove Action(s)")}
        on:mouseleave={handleToolbarButtonBlur}
        disabled={!isSelection}
        iconPath={"remove"}
        color={"#ff2323"}
      />
    </div>
  </div>
  <div class="flex items-center ml-auto mr-2">
    <Options
      bind:selected={selectAllChecked}
      halfSelected={isSelection}
      on:selection-change={handleSelectAllClicked}
    />
  </div>
</app-action-multi-select>

<style>
</style>
