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
  import {
    moduleMidiChannelState,
    writeModuleMidiChannel,
    type ModuleMidiChannelState,
  } from "../../../runtime/system-midi-channel";
  import { isPasteActionsEnabled } from "./components/Toolbar";
  import {
    MeltRadio,
    MoltenInput,
    Toggle,
    MeltSelect,
  } from "@intechstudio/grid-uikit";
  import {
    EventType,
    EventTypeToNumber,
    ElementType,
  } from "@intechstudio/grid-protocol";
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
  // Last name we applied/read back. The reactive below only writes when
  // elementName differs from this, so a read-back (which sets both in lockstep
  // via setElementNameDisplay) never triggers a write or a spurious insert.
  let _lastElementName: string = "";

  onDestroy(() => {
    appSettings.update((store) => {
      store.isMultiView = false;
      return store;
    });
  });

  $: handleContextChange($user_input, $runtime_manager);

  // Fires only when elementName changes from a real user edit — read-backs set
  // _lastElementName in lockstep, so they compare equal and skip (no write, no
  // spurious `self:gen("")` insert just from navigating between elements).
  $: if (elementName !== _lastElementName) {
    _lastElementName = elementName;
    handleElementNameChange(elementName);
  }

  function setElementNameDisplay(value: string) {
    elementName = value;
    _lastElementName = value;
  }

  function handleElementNameChange(value: string | undefined) {
    if (typeof element === "undefined") {
      return;
    }

    element.name = value;

    const setup = element.findEvent(EventTypeToNumber(EventType.SETUP));

    // Mutate the local model only while typing — the grid push is deferred to
    // handleElementNameCommit (on blur/enter) so we don't sync every keystroke.
    if (setup.actionAt(0)?.short !== elementNameInformation.short) {
      // No name action yet — only create one for a non-empty name (an empty
      // name means "no name", so there is nothing to insert).
      if (value.length === 0) {
        return;
      }
      const data = new ActionData(
        elementNameInformation.short,
        generateScript(value),
      );
      setup.insert(0, new GridAction(setup, data)).catch(console.error);
      return;
    }

    const action = setup.actionAt(0);

    // Empty name — just remove the action (no point updating it beforehand).
    if (value.length === 0) {
      setup.remove(action).catch(console.error);
      return;
    }

    const match = action.script.match(elementNameInformation.valueRegex);
    const name = match ? match[1] : "";

    if (name !== value) {
      const data = new ActionData(
        elementNameInformation.short,
        generateScript(value),
      );

      updateAction(action, data, false);
    }
  }

  // Push the element's name to the grid once, on commit (blur/enter), rather
  // than on every keystroke. Mirrors how the ElementName block syncs on change.
  function handleElementNameCommit() {
    if (typeof element === "undefined") {
      return;
    }
    element.findEvent(EventTypeToNumber(EventType.SETUP))?.sendToGrid();
  }

  function handleElementChange(element: GridElement) {
    refreshElementNameDisplay(element);
  }

  // Recompute the panel's name field from the element's Setup action-0. Read
  // only — sets elementName and _lastElementName in lockstep so it never
  // triggers a write. Runs on navigation and (reactively) on live edits, so
  // editing the ElementName action block reflects into the field instantly.
  function refreshElementNameDisplay(el: GridElement | undefined) {
    if (typeof el === "undefined" || !el.isLoaded()) {
      return;
    }

    const setup = el.findEvent(EventTypeToNumber(EventType.SETUP));
    const action = setup?.actionAt(0);

    if (action?.short === elementNameInformation.short) {
      // Null-safe: a hand-edited sn script that doesn't match reads as empty
      // rather than throwing (this runs on every element-store emission).
      const match = action.script.match(elementNameInformation.valueRegex);
      const value = match ? match[1] : "";
      if (value !== elementName) {
        setElementNameDisplay(value);
        el.name = value;
      }
    } else if (elementName !== "") {
      setElementNameDisplay("");
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

    if (typeof element !== "undefined") {
      if (element.isLoaded()) {
        handleElementChange(element);
      } else {
        const loadingElement = element;
        loadingElement
          .load()
          .then(() => {
            // Only apply if the element hasn't changed while loading
            if (element === loadingElement) {
              handleElementChange(loadingElement);
            }
          })
          .catch((err) => {
            console.error("Failed to load element:", err);
          });
      }
    }
  }

  // --- System MIDI Channel ---
  // All parse/serialize logic lives in runtime/system-midi-channel.ts. This
  // component only maps between that state and the dropdown's string value.

  let containerWidth: number;

  function handleSystemMidiChannelChange(value: number | null) {
    if (typeof element === "undefined" || element.type !== ElementType.SYSTEM) {
      return;
    }
    // Dropdown is 1-based; the stored Lua channel is 0-based. null = Auto.
    writeModuleMidiChannel(
      element.parent as GridPage,
      value === null ? null : value - 1,
    );
  }

  const MIDI_AUTO_SENTINEL = "auto";
  const MIDI_CUSTOM_SENTINEL = "custom";
  const baseMidiChannelOptions = [
    { title: "Auto", value: MIDI_AUTO_SENTINEL },
    ...Array.from({ length: 16 }, (_, i) => ({
      title: `Channel ${i + 1}`,
      value: String(i + 1),
    })),
  ];

  // Append a display-only "Custom" entry while the block holds hand-written
  // code, so MeltSelect renders it instead of going blank (a blank select
  // would write `undefined` back through bind:target → `return NaN`).
  $: midiChannelOptions =
    midiChannelDisplay === MIDI_CUSTOM_SENTINEL
      ? [
          ...baseMidiChannelOptions,
          { title: "Expression", value: MIDI_CUSTOM_SENTINEL },
        ]
      : baseMidiChannelOptions;

  // String target for MeltSelect — always a string, never null.
  // Updated programmatically by setMidiDisplay(); mutated by MeltSelect on user pick.
  let midiChannelDisplay: string = MIDI_AUTO_SENTINEL;
  // Last value we applied/read back. The reactive block below only fires a
  // hardware write when midiChannelDisplay differs from this, so a read-back
  // (which sets both) never triggers a write or removal.
  let _lastMidiDisplay: string = MIDI_AUTO_SENTINEL;

  function setMidiDisplay(display: string) {
    midiChannelDisplay = display;
    _lastMidiDisplay = display;
  }

  // Fires only when MeltSelect mutates midiChannelDisplay from a user pick —
  // read-backs set _lastMidiDisplay in lockstep, so they compare equal and skip.
  $: if (midiChannelDisplay !== _lastMidiDisplay) {
    _lastMidiDisplay = midiChannelDisplay;
    // "custom" is display-only, and a stray non-numeric value must never write
    // `return NaN` — only Auto or a real channel number reaches the hardware.
    if (midiChannelDisplay !== MIDI_CUSTOM_SENTINEL) {
      const value =
        midiChannelDisplay === MIDI_AUTO_SENTINEL
          ? null
          : Number(midiChannelDisplay);
      if (value === null || Number.isInteger(value)) {
        handleSystemMidiChannelChange(value);
      }
    }
  }

  // $element re-emits whenever a descendant action changes, so editing the
  // ElementName block updates the name field instantly (not just on navigation).
  $: ($element, refreshElementNameDisplay(element));

  // Config-derived channel for the selected element's page. Derives from the
  // system element's SETUP event store, so it tracks every config change —
  // including Clear (resetToDefaults notifies inside a batch that the $element
  // reactive would miss). setMidiDisplay sets display + _lastMidiDisplay in
  // lockstep, so applying a read-back never triggers a write back.
  $: midiChannelState = moduleMidiChannelState(
    element ? (element.parent as GridPage) : undefined,
  );
  $: applyMidiChannelState($midiChannelState);

  function applyMidiChannelState(state: ModuleMidiChannelState) {
    setMidiDisplay(
      state.kind === "channel"
        ? String(state.value + 1)
        : state.kind === "custom"
          ? MIDI_CUSTOM_SENTINEL
          : MIDI_AUTO_SENTINEL,
    );
  }

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
              <MoltenInput
                bind:target={elementName}
                on:change={handleElementNameCommit}
              />
            </div>
          </div>
        {/if}

        {#if $element && $element.type === ElementType.SYSTEM}
          <div
            class="flex flex-col gap-2 w-full text-sm items-start whitespace-nowrap p-3"
          >
            <span>Module MIDI Channel</span>
            <div class="flex w-full" data-testid="system-midi-channel">
              <MeltSelect
                options={midiChannelOptions}
                bind:target={midiChannelDisplay}
                size="full"
              />
            </div>
          </div>
        {/if}

        {#if !$appSettings.isMultiView}
          <div class="flex w-full px-3" data-testid="event-panel">
            <EventPanel {element} />
          </div>
        {/if}

        <div class="flex w-full px-3">
          <Toolbar {event} {element} />
        </div>
        <div class="flex flex-row h-full w-full max-h-full overflow-auto">
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
