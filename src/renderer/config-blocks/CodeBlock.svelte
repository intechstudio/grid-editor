<script lang="ts" context="module">
  import { type ActionBlockInformation } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "cb",
    name: "CodeBlock",
    rendering: "standard",
    category: "code",
    displayName: "Code Block",
    description: "Write Lua code by hand",
    color: categoryColors["code"] as any,
    defaultLua: 'print("hello")',
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m9 8.2-3.8 3.8L9 15.8M15 8.2l3.8 3.8L15 15.8"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m9 8.2-3.8 3.8L9 15.8M15 8.2l3.8 3.8L15 15.8"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    hiddenInMinimalist: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridAction, GridElement, GridEvent } from "./../runtime/runtime";
  import { type ElementType } from "@intechstudio/grid-protocol";

  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  import { Modal } from "../main/modals/modal.store";
  import { activeMonacoSession } from "../main/modals/monaco-session.store";
  import Monaco from "../main/modals/Monaco.svelte";
  import CodeEditor from "../main/user-interface/CodeEditor.svelte";
  import CommitStatus from "../main/user-interface/CommitStatus.svelte";
  import { appSettings } from "../runtime/app-helper.store";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let codeEditor: CodeEditor;
  let commitButton: HTMLElement;
  let commitEnabled = false;
  let errorMessage = "";

  // Ctrl/Cmd+S commits the block when focus is somewhere in it but outside
  // Monaco (e.g. nothing focused inside the editor). Triggers the Commit
  // button, which no-ops on its own when disabled. Focus inside Monaco is
  // handled separately by CodeEditor's `onSave` Monaco command, since a DOM
  // listener here can't observe keydowns that originate inside the editor.
  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      commitButton?.querySelector("button")?.click();
    }
  }

  $: elementType = ((action.parent as GridEvent)?.parent as GridElement)
    ?.type as ElementType;

  // Disable inline editing only for the block whose code is open in the full
  // editor modal, so the two editors can't fight over the same action. Other
  // blocks stay editable (issue #1390, part 2).
  $: editingInModal = $activeMonacoSession?.action === action;

  // The inline editor has uncommitted changes (edited script or a syntax error).
  $: inlineDirty = commitEnabled || errorMessage !== "";

  // Propagate the inline editor's syntax-error state to the action so the
  // block is flagged invalid (red border), like other action blocks do. The
  // committed script is kept; only the validity flag is toggled.
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

  // The invalid flag is set without touching the script, so revertToSynced
  // can't clear it. Clear it ourselves when the editor is torn down (navigating
  // away or collapsing the block) so the block doesn't stay flagged invalid.
  onDestroy(() => {
    if (hadError) {
      dispatch("update-action", {
        short: action.information.short,
        script: action.synced,
        validationError: false,
      });
    }
  });

  // When the modal closes for this block, reload the inline editor from the
  // committed script so discarded modal edits don't linger inline.
  let wasEditingInModal = false;
  $: {
    if (wasEditingInModal && !editingInModal) {
      codeEditor?.reset();
    }
    wasEditingInModal = editingInModal;
  }

  // Block editing on every code block while an editor has unsaved changes —
  // it can't be auto-replaced until it's committed or discarded (issue #1390).
  $: editDisabled = !!$activeMonacoSession && $activeMonacoSession.dirty;

  async function open_monaco() {
    const session = $activeMonacoSession;
    if (session) {
      // Editor is already showing this block — nothing to do.
      if (session.action === action) {
        return;
      }
      // Another block is open with unsaved changes: leave it be so the user
      // doesn't silently lose work (matches the pre-existing behavior).
      if (session.dirty) {
        return;
      }
      // Clean editor: auto-close it so it can be replaced by this block.
      session.close();
    }

    new Modal.Window(Monaco, Modal.Snap.GridLayout, {
      disableClickOutside: true,
      disableEscapeClose: true,
      showAsUnique: true,
    }).show({
      monaco_action: action,
      // Carry uncommitted inline edits into the modal so it opens on the
      // current content rather than the last committed state.
      initial_value: inlineDirty ? codeEditor?.getValue() : undefined,
    });
  }
</script>

<code-block
  class="relative w-full flex flex-col p-4 pb-2 pointer-events-auto"
  on:keydown={handleKeydown}
>
  <div
    class="w-full flex flex-col"
    class:grayscale={editingInModal}
    class:opacity-50={editingInModal}
  >
    <div class="flex flex-row gap-2 items-center mb-2 flex-wrap">
      <CommitStatus {commitEnabled} />
      <div class="flex-grow" />
      <div class="flex flex-row gap-2 items-center">
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
      </div>
    </div>

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
  </div>

  {#if editingInModal}
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
</code-block>
