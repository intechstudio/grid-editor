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

  onDestroy(() => {
    appSettings.update((store) => {
      store.isMultiView = false;
      return store;
    });
  });

  $: handleContextChange($user_input, $runtime_manager);

  $: handleElementNameChange(elementName);

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

    // Read back MIDI channel for system element — always reset first
    let readbackChannel: number | null = null;

    if (element.type === ElementType.SYSTEM && setup) {
      const fstIndex = findMidiAutoChBlock(setup);
      if (fstIndex !== -1) {
        const fenIndex = setup.config.findIndex(
          (a, i) => i > fstIndex && a.short === "fen",
        );
        const endIndex = fenIndex !== -1 ? fenIndex : setup.config.length;
        const cbAction = setup.config.find(
          (a, i) =>
            i > fstIndex &&
            i < endIndex &&
            a.short === "cb" &&
            MIDI_AUTO_CH_CB_REGEX.test(a.script),
        );
        const match = cbAction?.script?.match(MIDI_AUTO_CH_CB_REGEX);
        readbackChannel = match ? Number(match[1]) + 1 : null;
      }
    }

    systemMidiChannel = readbackChannel;
    setMidiDisplay(readbackChannel);
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
  const MIDI_AUTO_CH_FST_SCRIPT = "midi_auto_ch = function(self)"; // humanized form (spaces)
  const MIDI_AUTO_CH_FST_SCRIPT_SHORT = "midi_auto_ch=function(self)"; // shortified form (no spaces, from hardware)
  const MIDI_AUTO_CH_CB_REGEX = /^return (\d+)$/;

  let containerWidth: number;
  let systemMidiChannel: number | null = null;

  function findMidiAutoChBlock(setup: GridEvent): number {
    return setup.config.findIndex(
      (a) =>
        a.short === "fst" &&
        (a.script === MIDI_AUTO_CH_FST_SCRIPT ||
          a.script === MIDI_AUTO_CH_FST_SCRIPT_SHORT),
    );
  }

  function handleSystemMidiChannelChange(value: number | null) {
    if (typeof element === "undefined") return;
    if (element.type !== ElementType.SYSTEM) return;

    const setup = element.findEvent(EventTypeToNumber(EventType.SETUP));
    if (!setup) return;
    const fstIndex = findMidiAutoChBlock(setup);

    if (value === null) {
      // Auto selected — remove fst + everything up to and including its fen
      if (fstIndex !== -1) {
        const fenIndex = setup.config.findIndex(
          (a, i) => i > fstIndex && a.short === "fen",
        );
        const endIndex = fenIndex !== -1 ? fenIndex + 1 : fstIndex + 1;
        // Snapshot the actions to remove before modifying config
        const actionsToRemove = [...setup.config.slice(fstIndex, endIndex)];
        // Remove one by one to avoid partial-remove rejections
        const removeSequentially = async () => {
          for (const action of actionsToRemove) {
            // Re-check it's still in config (it may have already been removed)
            if (setup.config.includes(action)) {
              await setup.remove(action).catch(console.error);
            }
          }
          await setup.sendToGrid();
        };
        removeSequentially();
      }
      return;
    }

    // channel is 1-based from dropdown, Lua return value is 0-based
    const returnVal = value - 1;
    const cbScript = `return ${returnVal}`;

    if (fstIndex !== -1) {
      // Function block exists — find the first cb with our return pattern
      // between fst and fen, or insert one right after fst
      const fenIndex = setup.config.findIndex(
        (a, i) => i > fstIndex && a.short === "fen",
      );
      const endIndex = fenIndex !== -1 ? fenIndex : setup.config.length;
      const cbIndex = setup.config.findIndex(
        (a, i) =>
          i > fstIndex &&
          i < endIndex &&
          a.short === "cb" &&
          MIDI_AUTO_CH_CB_REGEX.test(a.script),
      );
      if (cbIndex !== -1) {
        // Matching cb found — update it
        const cbAction = setup.config[cbIndex];
        const data = new ActionData("cb", cbScript, cbAction.name);
        updateAction(cbAction, data, true);
      } else {
        // No matching cb — insert a new one right after fst
        const newCb = new GridAction(
          setup as GridEvent,
          new ActionData("cb", cbScript),
        );
        (setup as GridEvent)
          .insert(fstIndex + 1, newCb)
          .then(() => (setup as GridEvent).sendToGrid())
          .catch(console.error);
      }
    } else {
      // Insert 3 new blocks at index 0
      const fstAction = new GridAction(
        setup as GridEvent,
        new ActionData("fst", MIDI_AUTO_CH_FST_SCRIPT),
      );
      const cbAction = new GridAction(
        setup as GridEvent,
        new ActionData("cb", cbScript),
      );
      const fenAction = new GridAction(
        setup as GridEvent,
        new ActionData("fen", "end"),
      );
      (setup as GridEvent)
        .insert(0, fstAction, cbAction, fenAction)
        .then(() => (setup as GridEvent).sendToGrid())
        .catch(console.error);
    }
  }

  const MIDI_AUTO_SENTINEL = "auto";
  const midiChannelOptions = [
    { title: "Auto", value: MIDI_AUTO_SENTINEL },
    ...Array.from({ length: 16 }, (_, i) => ({
      title: `Channel ${i + 1}`,
      value: String(i + 1),
    })),
  ];

  // String target for MeltSelect — always a string, never null.
  // Updated programmatically by setMidiDisplay(); mutated by MeltSelect on user pick.
  let midiChannelDisplay: string = MIDI_AUTO_SENTINEL;
  let _midiDisplayUpdating = false;

  function setMidiDisplay(value: number | null) {
    _midiDisplayUpdating = true;
    midiChannelDisplay = value === null ? MIDI_AUTO_SENTINEL : String(value);
    _midiDisplayUpdating = false;
  }

  // Fires whenever MeltSelect mutates midiChannelDisplay.
  // Guard skips it when setMidiDisplay() is the one changing it.
  $: if (!_midiDisplayUpdating) {
    handleSystemMidiChannelChange(
      midiChannelDisplay === MIDI_AUTO_SENTINEL
        ? null
        : Number(midiChannelDisplay),
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
              <MoltenInput bind:target={elementName} />
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
