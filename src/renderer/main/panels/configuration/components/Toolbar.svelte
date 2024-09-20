<script>
  import { grid } from "@intechstudio/grid-protocol";
  import { derived, writable } from "svelte/store";
  import { runtime, user_input } from "./../../../../runtime/runtime.store.js";
  import {
    createCopyAllDisabledStore,
    createOverwriteDisabledStore,
    createDiscardElementDisabledStore,
    createClearElementDisabledStore,
    createMergeDisabledStore,
    createCutDisabledStore,
    createCopyDisabledStore,
    createPasteDisabledStore,
    createRemoveDisabledStore,
  } from "../configuration-actions";
  import { shortcut } from "./../../../_actions/shortcut.action.ts";
  import MoltenToolbarButton from "../../../user-interface/MoltenToolbarButton.svelte";
  import Options from "./Options.svelte";
  import { createEventDispatcher } from "svelte";
  import { ConfigTarget, configManager } from "../Configuration.store";

  const dispatch = createEventDispatcher();

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
        if (typeof $configManager.find((e) => e.selected) !== "undefined") {
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

  function handleClearElement() {
    dispatch("clear-element");
  }

  const target = writable();
  $: {
    if ($runtime) {
      target.set(
        ConfigTarget.createFrom({
          userInput: $user_input,
        })
      );
    }
  }

  const copyElementDisabled = createCopyAllDisabledStore(target);
  const overwriteElementDisabled = createOverwriteDisabledStore(target);
  const discardElementDisabled = createDiscardElementDisabledStore(target);
  const clearElementDisabled = createClearElementDisabledStore(target);
  const copyDisabled = createCopyDisabledStore(target);
  const pasteDisabled = createPasteDisabledStore(target);
  const cutDisabled = createCutDisabledStore(target);
  const mergeActionToCodeDisabled = createMergeDisabledStore(target);
  const removeDisabled = createRemoveDisabledStore(target);

  const selectAllChecked = derived([configManager], ([$configManager]) => {
    return (
      typeof $configManager.find((e) => !e.selected) === "undefined" &&
      $configManager.length > 0
    );
  });
</script>

<div class="flex flex-col">
  <div class="grid grid-cols-[1fr_auto_auto] items-center">
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
          disabled={$copyElementDisabled}
          color={"#03cb00"}
        />

        <MoltenToolbarButton
          on:click={handleOverwriteAll}
          on:mouseenter={() =>
            setToolbarHoverText(`Overwrite Element`, `(${modifier[0]} + V)`)}
          on:mouseleave={handleToolbarButtonBlur}
          shortcut={{ control: true, code: "KeyV" }}
          iconPath={"paste_all"}
          disabled={$overwriteElementDisabled}
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
          disabled={$discardElementDisabled}
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
          disabled={$clearElementDisabled}
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
          disabled={$copyDisabled}
          iconPath={"copy"}
          color={"#03cb00"}
        />

        <MoltenToolbarButton
          on:click={handlePasteClicked}
          on:mouseenter={() =>
            setToolbarHoverText(`Paste Action(s)`, `(${modifier[0]} + V)`)}
          on:mouseleave={handleToolbarButtonBlur}
          shortcut={{ control: true, code: "KeyV" }}
          disabled={$pasteDisabled}
          iconPath={"paste"}
          color={"#006cb7"}
        />

        <MoltenToolbarButton
          on:click={handleCutClicked}
          on:mouseenter={() =>
            setToolbarHoverText(`Cut Action(s)`, `(${modifier[0]} + X)`)}
          on:mouseleave={handleToolbarButtonBlur}
          shortcut={{ control: true, code: "KeyX" }}
          disabled={$cutDisabled}
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
          disabled={$mergeActionToCodeDisabled}
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
          disabled={$removeDisabled}
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
        selected={$selectAllChecked}
        halfSelected={typeof $configManager.find((e) => e.selected) !==
          "undefined"}
        on:selection-change={handleSelectAllClicked}
      />
    </button>
  </div>

  <div class="flex flex-row gap-2">
    <div class="text-gray-500 text-sm">Char Count:</div>
    <div class="text-white text-sm mr-10">
      <span data-testid="charCount"
        >{$configManager.toConfigScript().length}/{grid.getProperty(
          "CONFIG_LENGTH"
        ) - 1}
      </span>
    </div>
  </div>
</div>
