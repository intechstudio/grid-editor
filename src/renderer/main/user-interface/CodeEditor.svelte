<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import { GridScript, type ElementType } from "@intechstudio/grid-protocol";
  import { Grid } from "../../lib/_utils";
  import { appSettings } from "../../runtime/app-helper.store";
  import { MonacoEditor } from "../../lib/monaco";
  import { editor as monacoEditor, Uri } from "monaco-editor";
  import {
    openEditorContext,
    closeEditorContext,
  } from "../../lib/monaco-luals-client";
  import { GridAction, ActionData, GridEvent } from "../../runtime/runtime";
  import { updateAction } from "../../runtime/operations";

  // The action whose script is being edited.
  export let action: GridAction;
  // Name to persist alongside the script on commit (host owns name editing).
  export let name: string | undefined = undefined;
  // Autocomplete scope (element type), passed through to Monaco.
  export let restrictScope: ElementType | undefined = undefined;
  export let readOnly = false;
  // Show the line-number gutter. Disabled for the compact in-action-block editor.
  export let lineNumbers = true;
  // Wrap long lines. When false, lines scroll horizontally instead.
  export let wordWrap = true;
  // Show autocomplete suggestions while typing. Disabled for the inline editor.
  export let suggestions = true;
  // Wire this editor up to the Lua language server: opens a per-editor context
  // document (typing `self`/`element`/`ele` as the element subclass) and backs
  // the editor with a `.lua`-URI model so LuaLS provides stdlib + custom API
  // hover/completion. Off by default; the full-screen modal opts in.
  export let luals = false;
  // Initial editor text (expanded form) overriding the action's committed
  // script — used to carry uncommitted inline edits into the modal.
  export let initialValue: string | undefined = undefined;

  // Bindable state for the host (commit button, status, character count).
  export let commitEnabled = false;
  export let errorMessage = "";
  export let scriptLength: number | undefined = undefined;
  // Bindable raw editor instance, for hosts that need direct access
  // (e.g. the modal's suggest-widget escape handling).
  export let editor: MonacoEditor.CustomCodeEditor | undefined = undefined;

  let monaco_block: HTMLElement;
  let commited = { script: "", name: "" };
  let disposables: { dispose: () => void }[] = [];
  // LuaLS-backed editor state (only populated when `luals` is true).
  let lualsContextUri: string | null = null;
  let editorModel: ReturnType<typeof monacoEditor.createModel> | null = null;

  // Thrown for the script-length limit so it can be told apart from parse errors.
  class LengthError extends String {}

  $: if (editor) {
    editor.updateOptions({ fontSize: $appSettings.persistent.fontSize });
  }

  $: if (editor) {
    MonacoEditor.setTheme(
      $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
    );
  }

  $: editor?.updateOptions({ readOnly });

  // Reload the editor when the action's script is changed elsewhere (e.g.
  // committed from the modal while this inline editor is showing the block),
  // so its content stays in sync with the committed state.
  $: syncExternalScript($action.script);

  function syncExternalScript(script: string) {
    if (!editor) return;
    // Our own (un)committed state — nothing external changed.
    if (script === commited.script) return;
    commited.script = script;
    commited.name = action.name;
    const expanded = GridScript.expandScript(script);
    if (editor.getValue() !== expanded) {
      // setValue retriggers handleContentChange, which clears commitEnabled.
      editor.setValue(expanded);
    } else {
      commitEnabled = false;
    }
  }

  onMount(async () => {
    await tick();
    commited.name = action.name;
    commited.script = action.script;
    scriptLength = (action.parent as GridEvent).toLua().length;

    const value = initialValue ?? GridScript.expandScript(action.script);

    if (luals) {
      // Register the element-scoped context document so LuaLS types
      // `self`/`element`/`ele` for completion and hover.
      lualsContextUri = await openEditorContext(restrictScope ?? "");

      // Back the editor with a model that has a `.lua` URI so LuaLS recognises
      // it as a Lua file and provides stdlib (print, string, …) hover/completion
      // alongside our custom API. An inmemory:// model is treated as unknown.
      const modelUri = Uri.parse(
        `file:///grid-editor/editor-${Date.now()}.lua`,
      );
      editorModel = monacoEditor.createModel(value, "intech_lua", modelUri);
    }

    editor = MonacoEditor.create(monaco_block, {
      ...(editorModel
        ? { model: editorModel }
        : { value, language: "intech_lua" }),
      theme: $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
      fontSize: $appSettings.persistent.fontSize,
      restrictScope,
      readOnly,
      // Ctrl/Cmd+S commits the editor, no-op'ing when there's nothing to
      // commit or an unresolved error (matches the disabled Commit button).
      onSave: () => {
        if (!readOnly && commitEnabled && !errorMessage) {
          commit();
        }
      },
      folding: false,
      renderLineHighlight: "none",
      contextmenu: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: wordWrap ? "on" : "off",
      suggest: {
        showIcons: true,
        showWords: true,
      },
      fixedOverflowWidgets: true,
      quickSuggestions: suggestions,
      suggestOnTriggerCharacters: suggestions,
      minimap: { enabled: false },
      // Hide the gutter entirely when line numbers are off, for a compact look.
      lineNumbers: lineNumbers ? "on" : "off",
      ...(lineNumbers
        ? {}
        : {
            lineNumbersMinChars: 0,
            glyphMargin: false,
            lineDecorationsWidth: 0,
          }),
    });

    disposables.push(editor.onDidChangeModelContent(handleContentChange));

    // An override may differ from the committed script, so reflect that as
    // unsaved changes right away.
    if (initialValue !== undefined) {
      handleContentChange();
    }
  });

  // Current editor text (expanded form), including uncommitted edits.
  export function getValue() {
    return editor?.getValue() ?? GridScript.expandScript(action.script);
  }

  // Discard any uncommitted edits and reload from the committed script.
  export function reset() {
    if (!editor) return;
    const expanded = GridScript.expandScript(action.script);
    if (editor.getValue() !== expanded) {
      editor.setValue(expanded);
    }
    commited.script = action.script;
    commited.name = action.name;
    commitEnabled = false;
    errorMessage = "";
  }

  onDestroy(() => {
    disposables.forEach((d) => d.dispose());
    if (lualsContextUri) closeEditorContext(lualsContextUri);
    editor?.dispose();
    editorModel?.dispose();
  });

  // Validate the current editor content and recompute commit/error state.
  // The action is mutated transiently only to measure the resulting event
  // length, then restored — it is not actually changed until commit().
  function handleContentChange() {
    try {
      const compressed = GridScript.compressScript(editor.getValue());
      $action.script = compressed;
      $action.name =
        name !== $action?.information.displayName ? name : undefined;
      scriptLength = ($action.parent as GridEvent).toLua().length;
      if (scriptLength >= Grid.Protocol.maxScriptLength) {
        throw new LengthError("Config limit reached.");
      }
      errorMessage = "";
      commitEnabled =
        $action.script !== commited.script || commited.name !== $action.name;
    } catch (e) {
      if (!(e instanceof LengthError)) {
        scriptLength = undefined;
      }
      commitEnabled = false;
      errorMessage = String(e).replace(/^error parsing: ?\n?/i, "");
    }
    $action.name = commited.name;
    $action.script = commited.script;
  }

  function handleNameChange(value: string | undefined) {
    if (!editor) return;
    if (value === action?.information.displayName) return;
    if (value !== action?.name) {
      handleContentChange();
    }
  }

  $: handleNameChange(name);

  // Persist the current content to the action and sync it to the grid.
  export function commit() {
    return updateAction(
      action,
      new ActionData(
        action.short,
        GridScript.compressScript(editor.getValue()),
        name !== $action?.information.displayName ? name : undefined,
      ),
      true,
    ).then(() => {
      commited.name = action.name;
      commited.script = action.script;
      commitEnabled = false;
    });
  }
</script>

<div bind:this={monaco_block} class="relative flex w-full h-full" />

<style>
  /* The editor theme's background is transparent (`editor.background`) so the
     surrounding container's own background shows through. Monaco's sticky
     scroll widget (pinned scope headers while scrolling) inherits that same
     transparent color by default, so scrolled-past code shows through behind
     the pinned lines. Force it opaque, matching the container background,
     so the sticky lines actually occlude the content scrolling beneath them. */
  :global(.monaco-editor .sticky-widget .sticky-widget-lines-scrollable) {
    background-color: var(--background-muted) !important;
  }
</style>
