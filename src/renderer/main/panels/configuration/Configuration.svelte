<script lang="ts">
  import {
    user_input,
    UserInputValue,
  } from "./../../../runtime/user-input.store";
  import ActionList from "./ActionList.svelte";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";
  import { fade } from "svelte/transition";
  import EventPanel from "./EventPanel.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import {
    GridElement,
    GridEvent,
    GridPage,
    GridRuntime,
  } from "../../../runtime/runtime";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { onDestroy, onMount } from "svelte";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { selected_actions } from "./../../../runtime/selected-actions.store";
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
  } from "../../../runtime/operations";
  import { isPasteActionsEnabled } from "./components/Toolbar";

  let runtime: GridRuntime;
  let element: GridElement;
  let event: GridEvent;
  let page: GridPage;

  let container: HTMLElement;

  onDestroy(() => {
    appSettings.update((store) => {
      store.isMultiView = false;
      return store;
    });
  });

  $: runtime = $runtime_manager.active.runtime;

  $: if ($runtime) {
    handleUserInputChange($user_input);
  }

  function handleUserInputChange(ui: UserInputValue) {
    page = runtime.findPage(ui.dx, ui.dy, ui.pagenumber);

    element = runtime.findElement(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
    );

    event = runtime.findEvent(
      ui.dx,
      ui.dy,
      ui.pagenumber,
      ui.elementnumber,
      ui.eventtype,
    );

    if (typeof element !== "undefined" && !element.isLoaded()) {
      element
        .load()
        .then((e) => {})
        .catch((err) => {
          console.error("Failed to load event:", err);
        });
    }
  }

  let containerWidth: number;

  $: {
    if (containerWidth) {
      appSettings.update((store) => {
        store.isMultiView =
          document.body.clientWidth * 0.4 < containerWidth &&
          containerWidth > 550 &&
          typeof element !== "undefined" &&
          store.persistent.multiViewEnabled;
        return store;
      });
    }
  }

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

  function handleSelectAll() {
    const selected = get(selected_actions);
    if (event.config.every((e) => selected.includes(e))) {
      selected_actions.set([]);
    } else {
      selected_actions.set(event.config);
    }
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
  }

  function handlePaste(e: CustomEvent) {
    const { index } = e?.detail ?? { index: undefined };
    pasteActions(event, index);
  }
</script>

<div
  role="tabpanel"
  tabindex="0"
  bind:this={container}
  class="flex w-full h-full configpanel activator-button"
  on:keydown={(e) => {
    //Ignore if origin node is input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target instanceof Element && e.target.hasAttribute("contenteditable"))
    ) {
      e.stopPropagation();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      handleCopy();
      e.preventDefault();
      e.stopPropagation();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
      handleCut();
      e.preventDefault();
      e.stopPropagation();
    } else if (
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "v" &&
      $isPasteActionsEnabled
    ) {
      handlePaste();
      e.preventDefault();
      e.stopPropagation();
    } else if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "delete") {
      handleRemove();
      e.preventDefault();
      e.stopPropagation();
    } else if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      e.key.toLowerCase() === "m"
    ) {
      handleConvertToCodeBlock();
      e.preventDefault();
      e.stopPropagation();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      handleSelectAll();
      e.preventDefault();
      e.stopPropagation();
    }
  }}
>
  {#if container}
    <div
      bind:clientWidth={containerWidth}
      class="w-full h-full flex flex-col bg-primary"
      transition:fade={{
        duration: 150,
        delay: 0,
      }}
    >
      <configs class="w-full h-full flex flex-col overflow-hidden text-left">
        <ElementSelectionPanel {page} />
        {#if !$appSettings.isMultiView}
          <EventPanel {element} />
        {/if}
        <Toolbar {event} {element} targetPanel={container} />
        <div class="flex flex-row h-full w-full max-h-full overflow-auto">
          {#if $appSettings.isMultiView}
            {#each $element?.events ?? [] as event, i}
              <ActionList
                {event}
                targetPanel={container}
                focusTrigger={`action-list-${i}`}
              />
              <div
                class="h-full flex border-r border-black"
                class:hidden={i === $element.events.length - 1}
              />
            {/each}
          {:else}
            <ActionList
              {event}
              targetPanel={container}
              focusTrigger={"action-list-0"}
            />
          {/if}
        </div>
      </configs>
    </div>
  {/if}
</div>
