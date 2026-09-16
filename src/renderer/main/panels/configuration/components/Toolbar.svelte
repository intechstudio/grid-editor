<script lang="ts">
  import {
    isClearElementEnabled,
    isCopyElementEnabled,
    isDiscardElementEnabled,
    isOverwriteElementEnabled,
    isCopyActionsEnabled,
    isCutActionsEnabled,
    isMergeActionsEnabled,
    isRemoveActionsEnabled,
    isPasteActionsEnabled,
  } from "./Toolbar";
  import { appClipboard } from "./../../../../runtime/clipboard.store";
  import { GridEvent, GridElement } from "./../../../../runtime/runtime";
  import { selected_actions } from "./../../../../runtime/selected-actions.store";
  import { IconButton } from "@intechstudio/grid-uikit";
  import { get } from "svelte/store";
  import {
    mergeActionsToCode,
    copyActions,
    removeActions,
    cutActions,
    discardElement,
    overwriteElement,
    copyElement,
    clearElement,
    pasteActions,
  } from "../../../../runtime/operations";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { Grid } from "../../../../lib/_utils";

  export let element: GridElement;
  export let event: GridEvent;

  function handleOverwriteElement() {
    overwriteElement(element);
  }

  function handleCopyElement() {
    copyElement(element);
  }

  function handleCopy() {
    copyActions(...get(selected_actions));
  }

  function handleClearElement() {
    clearElement(element);
  }

  function handleDiscardElement() {
    discardElement(element);
  }

  function handleConvertToCodeBlock() {
    const selected = get(selected_actions);
    if (!selected.every((e) => e.parent === selected[0].parent)) {
      throw "Clipboard error: Mismatched clipboard";
    }

    mergeActionsToCode(selected[0].parent as GridEvent, true, ...selected);
  }

  function handleRemove() {
    const selected = get(selected_actions);
    if (selected.length === 0) {
      return;
    }
    if (!selected.every((e) => e.parent === selected[0].parent)) {
      throw "Clipboard error: Mismatched clipboard";
    }

    removeActions(selected[0].parent as GridEvent, ...selected);
  }
  function handleCut() {
    const selected = get(selected_actions);
    if (selected.length === 0) return;

    if (!selected.every((e) => e.parent === selected[0].parent)) {
      throw "Clipboard error: Mismatched clipboard";
    }

    cutActions(selected[0].parent as GridEvent, ...selected);
    selected_actions.set([]);
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(event, index);
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
</script>

<div class="flex flex-col w-full">
  <div class="grid grid-cols-[1fr_auto_auto] items-end">
    <!-- When any of the array elements is true -->
    <div class="flex flex-col truncate gap-1">
      <span class="text-sm truncate">
        {#if typeof selectedAction === "undefined" && $appSettings.isMultiView !== true}
          <!-- {($event?.getName() ?? "No Device") + " Event"} -->
        {:else}
          {selectedAction?.at(0) ?? ""}
          <span style="color: var(--foreground-muted)"
            >{selectedAction?.at(1) ?? ""}</span
          >
        {/if}
      </span>
      <span class="text-sm truncate">
        {#if $appSettings.isMultiView !== true}
          <span style="color: var(--foreground-muted)">Script length: </span>
          <span
            data-testid="charCount"
            class={($event?.toLua().length ?? 0) >=
            Grid.Protocol.maxScriptLength * 0.98
              ? "text-error"
              : ($event?.toLua().length ?? 0) >=
                  (Grid.Protocol.maxScriptLength / 3) * 2
                ? "text-yellow-400"
                : ""}
            style={($event?.toLua().length ?? 0) >=
            (Grid.Protocol.maxScriptLength / 3) * 2
              ? ""
              : "color: var(--foreground-muted)"}
            >{$event?.toLua().length ?? 0}/{Grid.Protocol.maxScriptLength -
              1}</span
          >
        {/if}
      </span>
    </div>
    <div class="flex flex-col">
      <div class="flex flex-wrap justify-end">
        <div data-testid="copy_all">
          <IconButton
            on:click={handleCopyElement}
            on:mouseenter={() =>
              setToolbarHoverText("Copy Element", `(${modifier[0]} + C)`)}
            on:mouseleave={handleToolbarButtonBlur}
            iconPath={"copy_all"}
            disabled={$isCopyElementEnabled === false}
            compact
          />
        </div>

        <div data-testid="paste_all">
          <IconButton
            on:click={handleOverwriteElement}
            on:mouseenter={() =>
              setToolbarHoverText(`Overwrite Element`, `(${modifier[0]} + V)`)}
            on:mouseleave={handleToolbarButtonBlur}
            iconPath={"paste_all"}
            disabled={!isOverwriteElementEnabled($element, $appClipboard)}
            compact
          />
        </div>

        <div data-testid="discard_changes">
          <IconButton
            on:click={handleDiscardElement}
            on:mouseenter={() =>
              setToolbarHoverText(
                `Discard Element Changes`,
                `(${modifier[0]} + Shift + D)`,
              )}
            on:mouseleave={handleToolbarButtonBlur}
            iconPath={"clear_from_device_01"}
            disabled={!isDiscardElementEnabled($element)}
            compact
          />
        </div>

        <div data-testid="clear_element">
          <IconButton
            on:click={handleClearElement}
            on:mouseenter={() =>
              setToolbarHoverText(`Clear Element`, `(Shift + Delete)`)}
            on:mouseleave={handleToolbarButtonBlur}
            iconPath={"clear_element"}
            disabled={!isClearElementEnabled($element)}
            compact
          />
        </div>
      </div>
      <div class="flex flex-wrap justify-end">
        <div data-testid="copy_action">
          <IconButton
            on:click={handleCopy}
            on:mouseenter={() =>
              setToolbarHoverText(`Copy Action(s)`, `(${modifier[0]} + C)`)}
            on:mouseleave={handleToolbarButtonBlur}
            disabled={$isCopyActionsEnabled === false}
            iconPath={"copy"}
            compact
          />
        </div>

        {#if !$appSettings.isMultiView}
          <div data-testid="paste_action">
            <IconButton
              on:click={handlePaste}
              on:mouseenter={() =>
                setToolbarHoverText(`Paste Action(s)`, `(${modifier[0]} + V)`)}
              on:mouseleave={handleToolbarButtonBlur}
              disabled={$isPasteActionsEnabled === false}
              iconPath={"paste"}
              compact
            />
          </div>
        {/if}

        <div data-testid="cut_action">
          <IconButton
            on:click={handleCut}
            on:mouseenter={() =>
              setToolbarHoverText(`Cut Action(s)`, `(${modifier[0]} + X)`)}
            on:mouseleave={handleToolbarButtonBlur}
            disabled={$isCutActionsEnabled === false}
            iconPath={"cut"}
            compact
          />
        </div>

        <div data-testid="merge_code">
          <IconButton
            on:click={handleConvertToCodeBlock}
            on:mouseenter={() =>
              setToolbarHoverText(
                `Merge Action(s) into Code`,
                `(${modifier[0]} + Shift + M)`,
              )}
            on:mouseleave={handleToolbarButtonBlur}
            disabled={$isMergeActionsEnabled === false}
            iconPath={"merge_as_code"}
            compact
          />
        </div>

        <div data-testid="remove_action">
          <IconButton
            on:click={handleRemove}
            on:mouseenter={() =>
              setToolbarHoverText(`Remove Action(s)`, `(Delete)`)}
            on:mouseleave={handleToolbarButtonBlur}
            disabled={$isRemoveActionsEnabled === false}
            iconPath={"remove"}
            compact
          />
        </div>
      </div>
    </div>
  </div>
</div>
