<script lang="ts" context="module">
  import { type ActionBlockInformation } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "cb",
    name: "CodeBlock",
    rendering: "standard",
    category: "code",
    displayName: "Code Block",
    color: "#887880",
    defaultLua: 'print("hello")',
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 333 265" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M329.594 123.925L252.587 42.2591C247.854 37.2344 239.954 37.0052 234.934 41.7467C229.922 46.4843 229.689 54.3964 234.426 59.4172L303.345 132.5L234.426 205.591C229.689 210.612 229.922 218.52 234.934 223.262C237.349 225.541 240.433 226.67 243.505 226.67C246.823 226.67 250.136 225.354 252.588 222.757L329.595 141.087C334.135 136.267 334.135 128.742 329.594 123.925Z" fill="black"/>
      <path d="M98.5775 205.588L29.6629 132.5L98.5775 59.4133C103.31 54.3925 103.082 46.4798 98.0657 41.7428C93.0537 37.0052 85.1449 37.2344 80.4126 42.2552L3.4058 123.921C-1.13527 128.738 -1.13527 136.267 3.4058 141.084L80.4165 222.754C82.8724 225.358 86.1816 226.671 89.4993 226.671C92.5711 226.671 95.656 225.537 98.0657 223.258C103.086 218.52 103.31 210.608 98.5775 205.588Z" fill="black"/>
      <path d="M186.703 0.142824C179.889 -0.890373 173.512 3.79254 172.471 10.6135L135.841 250.612C134.8 257.437 139.483 263.816 146.301 264.858C146.942 264.954 147.574 265 148.203 265C154.268 265 159.588 260.571 160.533 254.387L197.163 14.3888C198.204 7.56336 193.521 1.18448 186.703 0.142824Z" fill="black"/>
    </svg>
    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 333 265" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M329.594 123.925L252.587 42.2591C247.854 37.2344 239.954 37.0052 234.934 41.7467C229.922 46.4843 229.689 54.3964 234.426 59.4172L303.345 132.5L234.426 205.591C229.689 210.612 229.922 218.52 234.934 223.262C237.349 225.541 240.433 226.67 243.505 226.67C246.823 226.67 250.136 225.354 252.588 222.757L329.595 141.087C334.135 136.267 334.135 128.742 329.594 123.925Z" fill="black"/>
      <path d="M98.5775 205.588L29.6629 132.5L98.5775 59.4133C103.31 54.3925 103.082 46.4798 98.0657 41.7428C93.0537 37.0052 85.1449 37.2344 80.4126 42.2552L3.4058 123.921C-1.13527 128.738 -1.13527 136.267 3.4058 141.084L80.4165 222.754C82.8724 225.358 86.1816 226.671 89.4993 226.671C92.5711 226.671 95.656 225.537 98.0657 223.258C103.086 218.52 103.31 210.608 98.5775 205.588Z" fill="black"/>
      <path d="M186.703 0.142824C179.889 -0.890373 173.512 3.79254 172.471 10.6135L135.841 250.612C134.8 257.437 139.483 263.816 146.301 264.858C146.942 264.954 147.574 265 148.203 265C154.268 265 159.588 260.571 160.533 254.387L197.163 14.3888C198.204 7.56336 193.521 1.18448 186.703 0.142824Z" fill="black"/>
    </svg>
    `,
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

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let codeEditor: CodeEditor;
  let commitButton: HTMLElement;
  let commitEnabled = false;
  let errorMessage = "";

  // Ctrl/Cmd+S inside this block commits it. Caught here (not via a Monaco
  // keybinding) so it's scoped to the block: we stop propagation and trigger
  // the Commit button — which no-ops on its own when disabled.
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

    <div class="w-full h-32 border border-background-soft bg-background-muted">
      <CodeEditor
        bind:this={codeEditor}
        bind:commitEnabled
        bind:errorMessage
        {action}
        name={$action.name}
        restrictScope={elementType}
        readOnly={editingInModal}
        minLines={7}
        maxLines={7}
        lineNumbers={false}
        wordWrap={false}
        suggestions={false}
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
