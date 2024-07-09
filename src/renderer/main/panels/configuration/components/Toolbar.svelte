<script>
  import {
    appClipboard,
    ClipboardKey,
  } from "./../../../../runtime/clipboard.store.ts";
  import { shortcut } from "./../../../_actions/shortcut.action.ts";
  import { ConfigTarget } from "../Configuration.store";
  import { runtime, user_input } from "./../../../../runtime/runtime.store.js";
  import MoltenToolbarButton from "../../../user-interface/MoltenToolbarButton.svelte";
  import Options from "./Options.svelte";
  import { createEventDispatcher } from "svelte";
  import { configManager } from "../Configuration.store";

  const dispatch = createEventDispatcher();

  let isSelection = false;
  let selectAllChecked = false;

  $: {
    selectAllChecked =
      typeof $configManager.configs.configs.find((e) => !e.selected) ===
        "undefined" && $configManager.configs.configs.length > 0;
  }

  $: {
    isSelection =
      typeof $configManager.configs.configs.find((e) => e.selected) !==
      "undefined";
  }

  function handleConvertToCodeBlockClicked(e) {
    dispatch("convert-to-code-block", {
      configs: $configManager.configs.configs.filter((e) => e.selected),
      index: $configManager.configs.configs.findIndex((e) => e.selected), //First selected
    });
  }

  function handleCutClicked(e) {
    dispatch("cut");
  }

  function handleCopyClicked(e) {
    if (!isSelection) {
      return;
    }
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
      typeof $configManager.configs.configs.find((e) => e.selected == false) ===
      "undefined";
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
    if (isSelection) {
      return;
    }
    dispatch("copy-all");
  }

  function handleOverwriteAll(e) {
    if (isSelection) {
      return;
    }
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
    discardElementEnabled = target?.hasChanges() ?? false;
  }

  $: handleCalculateDiscardEnabled($runtime, $user_input);

  let selectedAction = undefined;

  function handleToolbarButtonHover(buttonText, hotkeyText) {
    selectedAction = [buttonText, hotkeyText];
  }

  function handleToolbarButtonBlur() {
    selectedAction = undefined;
  }

  const modifier =
    ctxProcess.platform() == "darwin" ||
    window.navigator.platform.indexOf("Mac") != -1
      ? ["Cmd ⌘", "Alt ⌥"]
      : ["Ctrl", "Alt"];

  function handleClearElement() {
    dispatch("clear-element");
  }
</script>

<app-action-multi-select
  class="grid grid-cols-[1fr_auto_auto] items-center -mb-2"
>
  <!-- When any of the array elements is true -->
  <div class="grid grid-cols-1 self-start">
    <span class="text-gray-500 text-sm truncate">Action: </span>
    <span
      class="text-white text-sm truncate"
      class:invisible={typeof selectedAction === "undefined"}
      >{selectedAction?.at(0)}</span
    >
    <span
      class="text-white text-sm truncate"
      class:invisible={typeof selectedAction === "undefined"}
      >{selectedAction?.at(1)}</span
    >
  </div>
  <div class="flex flex-col">
    <div class="flex flex-wrap justify-end">
      <MoltenToolbarButton
        on:click={handleCopyAll}
        on:mouseenter={() =>
          handleToolbarButtonHover("Copy Element", `(${modifier[0]} + C)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyC" }}
        iconPath={"copy_all"}
        disabled={isSelection || $runtime.length === 0}
        color={"#03cb00"}
      />

      <MoltenToolbarButton
        on:click={handleOverwriteAll}
        on:mouseenter={() =>
          handleToolbarButtonHover(`Overwrite Element`, `(${modifier[0]} + V)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyV" }}
        iconPath={"paste_all"}
        disabled={$appClipboard?.key !== ClipboardKey.ELEMENT ||
          ConfigTarget.createFrom({ userInput: $user_input })?.elementType !==
            $appClipboard?.payload.elementType}
        color={"#006cb7"}
      />

      <MoltenToolbarButton
        on:click={handleDiscard}
        on:mouseenter={() =>
          handleToolbarButtonHover(
            `Discard Element Changes`,
            `(${modifier[0]} + Shift + D)`
          )}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{
          control: true,
          shift: true,
          code: "KeyD",
        }}
        iconPath={"clear_from_device_01"}
        disabled={!discardElementEnabled}
        color={"#ff2323"}
      />

      <MoltenToolbarButton
        on:click={handleClearElement}
        on:mouseenter={() =>
          handleToolbarButtonHover(`Clear Element`, `(Shift + Delete)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{
          shift: true,
          code: "Delete",
        }}
        iconPath={"clear_element"}
        disabled={$runtime.length === 0}
        color={"#A020F0"}
      />
    </div>
    <div class="flex flex-wrap justify-end">
      <MoltenToolbarButton
        on:click={handleCopyClicked}
        on:mouseenter={() =>
          handleToolbarButtonHover(`Copy Action(s)`, `(${modifier[0]} + C)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyC" }}
        disabled={!isSelection}
        iconPath={"copy"}
        color={"#03cb00"}
      />

      <MoltenToolbarButton
        on:click={handlePasteClicked}
        on:mouseenter={() =>
          handleToolbarButtonHover(`Paste Action(s)`, `(${modifier[0]} + V)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyV" }}
        disabled={$appClipboard?.key !== ClipboardKey.ACTION_BLOCKS}
        iconPath={"paste"}
        color={"#006cb7"}
      />

      <MoltenToolbarButton
        on:click={handleCutClicked}
        on:mouseenter={() =>
          handleToolbarButtonHover(`Cut Action(s)`, `(${modifier[0]} + X)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyX" }}
        disabled={!isSelection}
        iconPath={"cut"}
        color={"#ff6100"}
      />

      <MoltenToolbarButton
        on:click={handleConvertToCodeBlockClicked}
        on:mouseenter={() =>
          handleToolbarButtonHover(
            `Merge Action(s) into Code`,
            `(${modifier[0]} + Shift + M)`
          )}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{
          control: true,
          shift: true,
          code: "KeyM",
        }}
        disabled={!isSelection}
        iconPath={"merge_as_code"}
        color={"#ffcc33"}
      />

      <MoltenToolbarButton
        on:click={handleRemoveClicked}
        on:mouseenter={() =>
          handleToolbarButtonHover(`Remove Action(s)`, `(Delete)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{
          code: "Delete",
        }}
        disabled={!isSelection}
        iconPath={"remove"}
        color={"#ff2323"}
      />
    </div>
  </div>
  <button
    class="w-fit h-fit mx-2"
    use:shortcut={{
      control: true,
      code: "KeyA",
      callback: handleSelectAllClicked,
    }}
    on:mouseenter={() =>
      handleToolbarButtonHover(`Select All`, `(${modifier[0]} + A)`)}
    on:mouseleave={handleToolbarButtonBlur}
  >
    <Options
      bind:selected={selectAllChecked}
      halfSelected={isSelection}
      on:selection-change={handleSelectAllClicked}
    />
  </button>
</app-action-multi-select>

<style>
</style>
