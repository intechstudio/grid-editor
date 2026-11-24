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
    defaultLua:
      'dim=40 --[[slider,0,100]]--[[Dims all the LEDs]]mode="absolute" --[[select,"absolute","relative"]]--[[How the value is applied]]enabled=true --[[toggle]]--[[Turns the effect on or off]]offset=0 --[[input]]--[[Added to every value]]',
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
  import { GridScript, type ElementType } from "@intechstudio/grid-protocol";
  import {
    MeltSelect,
    MeltSlider,
    MoltenPushButton,
    Toggle,
  } from "@intechstudio/grid-uikit";

  import LineEditor from "../main/user-interface/LineEditor.svelte";
  import CodeEditorPanel from "./components/CodeEditorPanel.svelte";
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
  // The module keeps the script compressed (no newlines); the controls work
  // on the expanded form that the code editor shows.
  $: checked = checkConfigScript(GridScript.expandScript($action.script));
  $: config = (checked.ok ? checked.config : null) as ParsedConfig | null;
  $: configError = checked.ok ? "" : checked.error;
  // Minimalist mode has no code view: the controls are always shown.
  $: minimalist = $appSettings.persistent.userLevelMinimalist === true;
  $: showControls = (locked || minimalist) && config !== null;

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
      script: GridScript.compressScript(configToLua(next)),
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

  // --- Code editor mode: the shared panel used by the Code block ---

  let inlineDirty = false;
  let editingInModal = false;

  $: elementType = ((action.parent as GridEvent)?.parent as GridElement)
    ?.type as ElementType;

  // Uncommitted code edits would be lost when the editor goes away, so the
  // block can only lock once they are committed or discarded.
  $: lockDisabled = !locked && (inlineDirty || editingInModal);

  function toggleLock() {
    locked = !locked;
  }
</script>

<global-config class="w-full flex flex-col">
  {#if showControls && config}
    <div class="relative w-full flex flex-col p-4 pb-2 pointer-events-auto">
      <div class="flex flex-row gap-2 mb-2 items-center">
        <div class="flex flex-col min-w-0 flex-1">
          <!-- One message at a time; the height is reserved so nothing shifts -->
          <div class="flex min-h-5 items-center">
            {#if adjusted && unsaved}
              <div class="text-warning" data-testid="global-config-store">
                Warning: Store your changes to apply changes to the module.
              </div>
            {:else}
              <div class="text-foreground">
                Adjust the configuration with the controls below.
              </div>
            {/if}
          </div>
        </div>
        {#if !minimalist}
          <div class="shrink-0">
            <MoltenPushButton
              click={toggleLock}
              disabled={lockDisabled}
              text={"Configure"}
            />
          </div>
        {/if}
      </div>

      <div
        class="flex flex-col border-t border-background-soft"
        data-testid="global-config-controls"
      >
        {#each config.entries as entry, i (entry.name)}
          <div
            class="flex flex-col gap-1 py-3 border-b border-background-soft last:border-b-0"
          >
            {#if entry.description}
              <span
                class="text-foreground-muted break-words"
                data-testid="global-config-description"
                >{entry.description}</span
              >
            {/if}
            <div class="grid grid-cols-[25%_1fr] gap-3 items-center">
              <span
                class="text-foreground truncate"
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
                  <div class="flex-grow min-w-0">
                    <MeltSlider
                      bind:target={values[i]}
                      min={entry.spec.min}
                      max={entry.spec.max}
                      step={entry.spec.step}
                      fill
                      on:commit={() => dispatch("sync")}
                    />
                  </div>
                  <span
                    class="w-12 text-right tabular-nums text-foreground-muted"
                    >{values[i]}</span
                  >
                </div>
              {:else if entry.spec.type === "input"}
                <div
                  class="border border-background-soft flex items-center w-full"
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
          </div>
        {/each}
      </div>
    </div>
  {:else}
    {#if config === null}
      <div class="text-warning px-4 pt-4" data-testid="global-config-error">
        No controls for this script: {configError}
      </div>
    {/if}
    <CodeEditorPanel
      {action}
      showOpenEditor={false}
      showDiscard={false}
      bind:inlineDirty
      bind:editingInModal
      on:update-action
    >
      <div slot="actions" class:hidden={minimalist && config !== null}>
        <MoltenPushButton
          click={toggleLock}
          disabled={lockDisabled || config === null}
          text={"Save"}
        />
      </div>
    </CodeEditorPanel>
  {/if}
</global-config>
