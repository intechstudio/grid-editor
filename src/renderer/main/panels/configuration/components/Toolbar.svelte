<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    appClipboard,
    ClipboardKey,
  } from "./../../../../runtime/clipboard.store";
  import { GridEvent, GridElement } from "./../../../../runtime/runtime";
  import { UserInputValue } from "./../../../../runtime/runtime.store";
  import { runtime, user_input } from "./../../../../runtime/runtime.store";
  import { shortcut } from "./../../../_actions/shortcut.action";
  import MoltenToolbarButton from "../../../user-interface/MoltenToolbarButton.svelte";
  import Options from "./Options.svelte";
  import { config_panel_blocks } from "../Configuration";

  const dispatch = createEventDispatcher();

  function handleConvertToCodeBlockClicked(e) {
    dispatch("convert-to-code-block");
  }

  function handleCutClicked(e) {
    dispatch("cut");
  }

  function handleCopyClicked(e) {
    dispatch("copy");
  }

  function handlePasteClicked(e) {
    dispatch("paste");
  }

  function handleRemoveClicked(e) {
    dispatch("remove");
  }

  function handleSelectAllClicked() {
    dispatch("select-all");
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

  function handleClearElement() {
    dispatch("clear-element");
  }

  let selectedAction = undefined;

  function setToolbarHoverText(buttonText, hotkeyText) {
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

  let event: GridEvent;
  let element: GridElement;

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui: UserInputValue) {
    element = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber
    );
    event = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype
    );
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
          setToolbarHoverText("Copy Element", `(${modifier[0]} + C)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyC" }}
        iconPath={"copy_all"}
        disabled={$runtime.modules.length === 0 ||
          $config_panel_blocks.some((e) => e.selected)}
        color={"#03cb00"}
      />

      <MoltenToolbarButton
        on:click={handleOverwriteAll}
        on:mouseenter={() =>
          setToolbarHoverText(`Overwrite Element`, `(${modifier[0]} + V)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyV" }}
        iconPath={"paste_all"}
        disabled={$appClipboard?.key !== ClipboardKey.ELEMENT ||
          !element?.isCompatible($appClipboard?.payload.elementType)}
        color={"#006cb7"}
      />

      <MoltenToolbarButton
        on:click={handleDiscard}
        on:mouseenter={() =>
          setToolbarHoverText(
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
        disabled={typeof $element === "undefined" || !$element.hasChanges()}
        color={"#ff2323"}
      />

      <MoltenToolbarButton
        on:click={handleClearElement}
        on:mouseenter={() =>
          setToolbarHoverText(`Clear Element`, `(Shift + Delete)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{
          shift: true,
          code: "Delete",
        }}
        iconPath={"clear_element"}
        disabled={$runtime.modules.length === 0}
        color={"#A020F0"}
      />
    </div>
    <div class="flex flex-wrap justify-end">
      <MoltenToolbarButton
        on:click={handleCopyClicked}
        on:mouseenter={() =>
          setToolbarHoverText(`Copy Action(s)`, `(${modifier[0]} + C)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyC" }}
        disabled={!$config_panel_blocks.some((e) => e.selected)}
        iconPath={"copy"}
        color={"#03cb00"}
      />

      <MoltenToolbarButton
        on:click={handlePasteClicked}
        on:mouseenter={() =>
          setToolbarHoverText(`Paste Action(s)`, `(${modifier[0]} + V)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyV" }}
        disabled={$appClipboard?.key !== ClipboardKey.ACTION_BLOCKS}
        iconPath={"paste"}
        color={"#006cb7"}
      />

      <MoltenToolbarButton
        on:click={handleCutClicked}
        on:mouseenter={() =>
          setToolbarHoverText(`Cut Action(s)`, `(${modifier[0]} + X)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{ control: true, code: "KeyX" }}
        disabled={!$config_panel_blocks.some((e) => e.selected)}
        iconPath={"cut"}
        color={"#ff6100"}
      />

      <MoltenToolbarButton
        on:click={handleConvertToCodeBlockClicked}
        on:mouseenter={() =>
          setToolbarHoverText(
            `Merge Action(s) into Code`,
            `(${modifier[0]} + Shift + M)`
          )}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{
          control: true,
          shift: true,
          code: "KeyM",
        }}
        disabled={!$config_panel_blocks.some((e) => e.selected)}
        iconPath={"merge_as_code"}
        color={"#ffcc33"}
      />

      <MoltenToolbarButton
        on:click={handleRemoveClicked}
        on:mouseenter={() =>
          setToolbarHoverText(`Remove Action(s)`, `(Delete)`)}
        on:mouseleave={handleToolbarButtonBlur}
        shortcut={{
          code: "Delete",
        }}
        disabled={!$config_panel_blocks.some((e) => e.selected)}
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
      setToolbarHoverText(`Select All`, `(${modifier[0]} + A)`)}
    on:mouseleave={handleToolbarButtonBlur}
  >
    <Options
      selected={$config_panel_blocks.every((e) => e.selected)}
      halfSelected={$config_panel_blocks.some((e) => e.selected)}
      disabled={$config_panel_blocks.length === 0}
      on:select={handleSelectAllClicked}
    />
  </button>
</app-action-multi-select>

<style>
</style>
