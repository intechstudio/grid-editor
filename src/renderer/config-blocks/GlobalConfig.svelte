<script lang="ts" context="module">
  import { type ActionBlockInformation } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // No collapsed face: the block is always open
  export const header = undefined;

  export const information: ActionBlockInformation = {
    short: "gcfg",
    name: "GlobalConfig",
    rendering: "standard",
    category: "variables",
    displayName: "Global Config",
    description:
      "Define globals with a friendly editor: sliders, selects, toggles and inputs",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/variables/global-config",
    color: categoryColors["variables"],
    defaultLua: `dim --[[slider,0,100]], mode --[[select,"absolute","relative"]], enabled --[[toggle]], offset --[[input]] = 40, "absolute", true, 0`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: false,
    hiddenInMinimalist: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridAction, GridElement, GridEvent } from "./../runtime/runtime";
  import { type ElementType } from "@intechstudio/grid-protocol";
  import {
    MeltSelect,
    MeltSlider,
    MoltenPushButton,
    Toggle,
  } from "@intechstudio/grid-uikit";

  import { Modal } from "../main/modals/modal.store";
  import { activeMonacoSession } from "../main/modals/monaco-session.store";
  import Monaco from "../main/modals/Monaco.svelte";
  import CodeEditor from "../main/user-interface/CodeEditor.svelte";
  import LineEditor from "../main/user-interface/LineEditor.svelte";
  import CommitStatus from "../main/user-interface/CommitStatus.svelte";
  import { appSettings } from "../runtime/app-helper.store";
  import { runtime_manager } from "../runtime/runtime-manager.store";
  import {
    configToLua,
    checkConfigScript,
    type ParsedConfig,
  } from "../lib/globalConfig";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  // Locked shows the friendly controls; unlocked is the code editor.
  let locked = true;

  // Null when the script is not a fully annotated config, which can only be
  // edited as code.
  $: checked = checkConfigScript($action.script);
  $: config = (checked.ok ? checked.config : null) as ParsedConfig | null;
  $: configError = checked.ok ? "" : checked.error;
  $: showControls = locked && config !== null;

  // After a control edit, remind the user that the module only keeps the
  // change once the page is stored. Hidden again when nothing is unsaved.
  let adjusted = false;
  let activeRuntime = $runtime_manager.active.runtime;
  $: activeRuntime = $runtime_manager.active.runtime;
  $: unsaved = !!$activeRuntime && activeRuntime.unsavedChangesCount() > 0;
  $: if (!unsaved) {
    adjusted = false;
  }

  // Control state; the components bind to it and changes go to the action.
  let values: any[] = [];
  $: values = config?.entries.map((e) => e.value) ?? [];

  function pushValues(current: typeof values) {
    if (config === null || !locked) {
      return;
    }
    const changed = config.entries.findIndex((e, i) => e.value !== current[i]);
    if (changed < 0 || current.length !== config.entries.length) {
      return;
    }
    const next = {
      ...config,
      entries: config.entries.map((e, i) => ({ ...e, value: current[i] })),
    };
    adjusted = true;
    dispatch("update-action", {
      short: information.short,
      script: configToLua(next),
      validationError: false,
    });
    // A slider syncs when the drag is committed, not on every step.
    // Inputs sync when the field is left.
    if (!["slider", "input"].includes(config.entries[changed].spec.type)) {
      dispatch("sync");
    }
  }

  // Runs only on control edits: external script changes reset `values` to
  // match the config, which makes this a no-op.
  $: pushValues(values);

  // --- Code editor mode: same behavior as the Code block ---

  let codeEditor: CodeEditor;
  let commitButton: HTMLElement;
  let commitEnabled = false;
  let errorMessage = "";

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      commitButton?.querySelector("button")?.click();
    }
  }

  $: elementType = ((action.parent as GridEvent)?.parent as GridElement)
    ?.type as ElementType;

  $: editingInModal = $activeMonacoSession?.action === action;
  $: inlineDirty = commitEnabled || errorMessage !== "";

  let hadError = false;
  $: {
    const hasError = errorMessage !== "";
    if (hasError !== hadError) {
      hadError = hasError;
      dispatch("update-action", {
        short: action.information.short,
        script: action.script,
        validationError: hasError,
      });
    }
  }

  onDestroy(() => {
    if (hadError) {
      dispatch("update-action", {
        short: action.information.short,
        script: action.synced,
        validationError: false,
      });
    }
  });

  let wasEditingInModal = false;
  $: {
    if (wasEditingInModal && !editingInModal) {
      codeEditor?.reset();
    }
    wasEditingInModal = editingInModal;
  }

  $: editDisabled = !!$activeMonacoSession && $activeMonacoSession.dirty;

  // Uncommitted code edits would be lost when the editor goes away, so the
  // block can only lock once they are committed or discarded.
  $: lockDisabled = !locked && (inlineDirty || editingInModal);

  function toggleLock() {
    locked = !locked;
  }

  async function open_monaco() {
    const session = $activeMonacoSession;
    if (session) {
      if (session.action === action) {
        return;
      }
      if (session.dirty) {
        return;
      }
      session.close();
    }

    new Modal.Window(Monaco, Modal.Snap.GridLayout, {
      disableClickOutside: true,
      disableEscapeClose: true,
      showAsUnique: true,
    }).show({
      monaco_action: action,
      initial_value: inlineDirty ? codeEditor?.getValue() : undefined,
    });
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<global-config
  class="relative w-full flex flex-col p-4 pb-2 pointer-events-auto"
  on:keydown={handleKeydown}
  tabindex="-1"
>
  <div
    class="w-full flex flex-col"
    class:grayscale={editingInModal}
    class:opacity-50={editingInModal}
  >
    <div
      class="flex flex-row gap-2 mb-2"
      class:flex-wrap={!showControls}
      class:items-center={!showControls}
      class:items-start={showControls}
    >
      {#if !showControls}
        <CommitStatus {commitEnabled} />
      {:else}
        <div class="flex flex-col min-w-0 flex-1">
          <div class="text-sm text-foreground">
            Adjust the configuration with the controls below.
          </div>
          <!-- Line is always reserved so the warning doesn't shift the layout -->
          <div
            class="text-sm text-orange-500 min-h-5"
            data-testid="global-config-store"
          >
            {#if adjusted && unsaved}
              Press <span class="text-green-500 font-semibold">Store</span> to apply
              this change to the module.
            {/if}
          </div>
        </div>
      {/if}
      {#if !showControls}
        <div class="flex-grow"></div>
      {/if}
      <div
        class="flex flex-row flex-wrap justify-end gap-2 items-center"
        class:shrink-0={showControls}
      >
        {#if !showControls}
          <MoltenPushButton
            click={open_monaco}
            disabled={editDisabled}
            text={"Open Editor"}
          />
          <MoltenPushButton
            click={() => codeEditor.reset()}
            disabled={!inlineDirty || editingInModal}
            text={"Discard"}
          />
          <div bind:this={commitButton} class="contents">
            <MoltenPushButton
              click={() => codeEditor.commit()}
              disabled={!commitEnabled || editingInModal}
              text={"Commit"}
              style={"accept"}
            />
          </div>
        {/if}
        <!-- Smaller in the locked view, where it is secondary to the controls -->
        <div class:text-xs={showControls}>
          <MoltenPushButton
            click={toggleLock}
            disabled={lockDisabled || config === null}
            text={locked ? "Unlock" : "Lock"}
          />
        </div>
      </div>
    </div>

    {#if showControls && config}
      <div class="flex flex-col" data-testid="global-config-controls">
        {#each config.entries as entry, i (entry.name)}
          <div
            class="grid grid-cols-[25%_1fr] gap-3 items-center py-3 border-b border-background-soft last:border-b-0"
          >
            <span
              class="text-sm text-foreground truncate"
              title={entry.name}
              data-testid="global-config-name">{entry.name}</span
            >
            {#if entry.spec.type === "select"}
              <MeltSelect
                size="full"
                options={entry.spec.options.map((o) => ({
                  title: o,
                  value: o,
                }))}
                bind:target={values[i]}
              />
            {:else if entry.spec.type === "toggle"}
              <div>
                <Toggle
                  testid={"global-config-" + entry.name}
                  title={values[i] ? "On" : "Off"}
                  bind:value={values[i]}
                />
              </div>
            {:else if entry.spec.type === "slider"}
              <div class="flex flex-row items-center gap-3">
                <div class="slider-fill flex-grow min-w-0">
                  <MeltSlider
                    bind:target={values[i]}
                    min={entry.spec.min}
                    max={entry.spec.max}
                    step={entry.spec.step}
                    on:commit={() => dispatch("sync")}
                  />
                </div>
                <span
                  class="w-12 text-right text-sm tabular-nums text-foreground-muted"
                  >{values[i]}</span
                >
              </div>
            {:else if entry.spec.type === "input"}
              <div
                class="border border-black flex items-center flex-grow h-full"
                data-testid="global-config-input"
              >
                <LineEditor
                  value={entry.value}
                  restrictScopeTo={elementType}
                  availableCharacters={Infinity}
                  luals
                  lualsExpressionOnly
                  on:input={(e) => (values[i] = e.detail.script ?? "")}
                  on:change={() => dispatch("sync")}
                />
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      {#if config === null}
        <div class="text-sm text-warning mb-2">
          No controls for this script: {configError}
        </div>
      {/if}
      <div class="w-full border border-background-soft bg-background-muted">
        <CodeEditor
          bind:this={codeEditor}
          bind:commitEnabled
          bind:errorMessage
          {action}
          name={$action.name}
          restrictScope={elementType}
          readOnly={editingInModal}
          lineCount={$appSettings.persistent.codeEditorDefaultLines}
          lineNumbers={false}
          wordWrap={false}
          luals
        />
      </div>

      {#if errorMessage}
        <div
          class="text-left text-sm text-error whitespace-pre-line max-h-24 overflow-y-auto mt-2"
        >
          {errorMessage}
        </div>
      {/if}
    {/if}
  </div>

  {#if editingInModal && !showControls}
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-auto"
    >
      <span
        class="text-lg font-bold text-foreground-muted [text-shadow:0_0_6px_var(--background),0_0_6px_var(--background),0_0_6px_var(--background),0_0_12px_var(--background),0_0_12px_var(--background)]"
      >
        Currently open in editor window!
      </span>
    </div>
  {/if}
</global-config>

<style>
  /* The uikit slider caps itself at 200px; let it fill the row */
  .slider-fill :global(span.container) {
    max-width: none !important;
  }
</style>
