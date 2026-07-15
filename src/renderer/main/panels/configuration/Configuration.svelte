<script lang="ts">
  import {
    user_input,
    type UserInputValue,
  } from "./../../../runtime/user-input.store";
  import ActionList from "./ActionList.svelte";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";
  import { fade } from "svelte/transition";
  import EventPanel from "./EventPanel.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import {
    ActionData,
    GridAction,
    GridElement,
    GridEvent,
    GridPage,
    GridRuntime,
  } from "../../../runtime/runtime";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { onDestroy } from "svelte";
  import {
    type GridRuntimeManagerData,
    runtime_manager,
  } from "../../../runtime/runtime-manager.store";
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
    updateAction,
  } from "../../../runtime/operations";
  import { isPasteActionsEnabled } from "./components/Toolbar";
  import { MeltRadio, MoltenInput, Toggle } from "@intechstudio/grid-uikit";
  import { EventType, EventTypeToNumber } from "@intechstudio/grid-protocol";
  import {
    information as elementNameInformation,
    generateScript,
  } from "../../../config-blocks/ElementName.svelte";

  let runtime: GridRuntime;
  let element: GridElement;
  let event: GridEvent;
  let page: GridPage;

  let container: HTMLElement;
  let elementName: string = "";

  onDestroy(() => {
    appSettings.update((store) => {
      store.isMultiView = false;
      return store;
    });
  });

  $: handleContextChange($user_input, $runtime_manager);

  $: handleElementNameChange(elementName);

  $: if ($element) {
    handleElementChange(element);
  }

  function handleElementNameChange(value: string | undefined) {
    if (typeof element === "undefined") {
      return;
    }

    element.name = value;

    const setup = element.findEvent(EventTypeToNumber(EventType.SETUP));

    if (setup.actionAt(0)?.short !== elementNameInformation.short) {
      const data = new ActionData(
        elementNameInformation.short,
        generateScript(value),
      );
      setup.insert(0, new GridAction(setup, data));
      return;
    }

    const action = setup.actionAt(0);
    const regex = elementNameInformation.valueRegex;
    const name = action.script.match(regex)[1];

    if (name !== value) {
      const data = new ActionData(
        elementNameInformation.short,
        generateScript(value),
      );

      updateAction(action, data, true);
    }

    if (value.length === 0) {
      setup.remove(action);
      setup.sendToGrid();
    }
  }

  function handleElementChange(element: GridElement) {
    const setup = element.findEvent(EventTypeToNumber(EventType.SETUP));
    const action = setup.actionAt(0);

    if (action?.short === elementNameInformation.short) {
      const regex = elementNameInformation.valueRegex;
      const value = action.script.match(regex)[1];
      if (value !== elementName) {
        elementName = value;
        element.name = value;
      }
    } else {
      elementName = "";
    }
  }

  function handleContextChange(
    ui: UserInputValue,
    rtm: GridRuntimeManagerData,
  ) {
    runtime = rtm.active.runtime;
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
          console.error("Failed to load element:", err);
        });
    }
  }

  let containerWidth: number;

  $: handleIsMultiViewAutoUpdate(
    containerWidth,
    $appSettings.persistent.multiViewEnabled,
  );

  function handleIsMultiViewAutoUpdate(containerWidth, multiViewEnabled) {
    if (!containerWidth) {
      return;
    }

    let multiView =
      document.body.clientWidth * 0.4 < containerWidth &&
      containerWidth > 550 &&
      typeof element !== "undefined" &&
      multiViewEnabled;
    if (multiView !== $appSettings.isMultiView) {
      appSettings.update((store) => {
        store.isMultiView = multiView;
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
    selected_actions.set([]);
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
      (e.target instanceof Element &&
        e.target.hasAttribute("contenteditable")) ||
      (e.target instanceof Element && e.target.closest(".monaco-editor"))
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
      class="w-full h-full flex flex-col"
      transition:fade={{
        duration: 150,
        delay: 0,
      }}
    >
      <configs
        class="w-full h-full flex flex-col overflow-hidden text-left pt-4"
      >
        <div class="flex flex-row gap-2 items-center px-3">
          <div class="flex flex-grow h-fit">
            <ElementSelectionPanel {page} />
          </div>
          <div class="flex flex-row items-center justify-end gap-2">
            {#if false}
              <MeltRadio
                bind:target={$appSettings.persistent.userLevelMinimalist}
                orientation={"horizontal"}
                style={"button"}
                options={[
                  { title: "Essentials", value: true },
                  { title: "Expert", value: false },
                ]}
              />
            {:else}
              <Toggle
                testid="minimalist_toggle"
                title="Minimalist mode"
                on:change={() => {
                  if ($appSettings.persistent.userLevelMinimalist === true) {
                    $appSettings.persistent.userLevelMinimalist = false;
                  } else {
                    $appSettings.persistent.userLevelMinimalist = true;
                  }
                }}
                value={$appSettings.persistent.userLevelMinimalist === true}
              />{/if}
          </div>
        </div>
        {#if $element}
          <div
            class="flex flex-col gap-2 w-full text-sm items-start whitespace-nowrap p-3"
          >
            <span>Element Name</span>
            <div class="flex w-full" data-testid="element-name-input-field">
              <MoltenInput bind:target={elementName} />
            </div>
          </div>
        {/if}

        {#if !$appSettings.isMultiView}
          <div class="flex w-full px-3" data-testid="event-panel">
            <EventPanel {element} />
          </div>
        {/if}

        <div
          class="flex w-full px-3 pt-4"
          style="background-color: var(--background-soft);"
        >
          <Toolbar {event} {element} />
        </div>
        <div
          class="flex flex-row h-full w-full max-h-full overflow-auto"
          style="background-color: var(--background-soft);"
        >
          {#if $appSettings.isMultiView}
            {#each $element?.events.filter((e) => (e.getName() !== "Setup" && e.getName() !== "Timer") || $appSettings.persistent.userLevelMinimalist === false) ?? [] as event, i}
              <ActionList {event} focusTrigger={`action-list-${i}`} />
            {/each}
          {:else}
            <ActionList {event} focusTrigger={"action-list-0"} />
          {/if}
        </div>
      </configs>
    </div>
  {/if}
</div>
