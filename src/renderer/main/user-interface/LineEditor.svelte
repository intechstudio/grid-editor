<script lang="ts">
  import { appSettings } from "../../runtime/app-helper.store";
  import {
    beforeUpdate,
    createEventDispatcher,
    onDestroy,
    onMount,
  } from "svelte";

  import { ElementType } from "@intechstudio/grid-protocol";
  import { MonacoEditor } from "../../lib/monaco";
  import { editor as monacoEditor, Uri } from "monaco-editor";
  import {
    openEditorContext,
    closeEditorContext,
    EXPRESSION_FRAGMENT_URI_MARKER,
  } from "../../lib/monaco-luals-client";

  const dispatch = createEventDispatcher();

  export let value;
  export let disabled = false;
  export let availableCharacters = Infinity;
  export let restrictScopeTo: ElementType | undefined = undefined;
  // Wire this editor up to the Lua language server: opens a per-editor context
  // document (typing `self`/`element`/`ele` as the element subclass) and backs
  // the editor with a `.lua`-URI model so LuaLS provides scoped completion,
  // matching CodeEditor's `luals` behavior.
  export let luals = false;
  // Set this when the editor only ever holds a single Lua *expression*
  // fragment (e.g. the right-hand side of an assignment, or an `if`
  // condition) rather than a full statement. A bare expression is not a
  // valid standalone Lua statement, so LuaLS would otherwise report a false
  // positive "Unexpected <exp>" syntax error on perfectly valid input.
  export let lualsExpressionOnly = false;

  let monaco_block;

  let editor;
  let input_buffer = value;
  let value_buffer = value;
  let newLinesRemoved = false;
  let editorHeight = 0;
  // LuaLS-backed editor state (only populated when `luals` is true).
  let lualsContextUri: string | null = null;
  let editorModel: ReturnType<typeof monacoEditor.createModel> | null = null;

  function handleDisabledChange(value) {
    editor.updateOptions({ readOnly: value });
  }

  $: {
    if (typeof editor !== "undefined") {
      handleDisabledChange(disabled);
    }
  }

  $: handleFontSizechange($appSettings.persistent.fontSize);

  $: if (editor) {
    handleLightModeChange($appSettings.persistent.lightMode);
  }

  function handleLightModeChange(value: boolean) {
    MonacoEditor.setTheme(
      value ? MonacoEditor.Theme.LIGHT : MonacoEditor.Theme.DARK,
    );
  }

  function handleFontSizechange(fontSize) {
    editor?.updateOptions({ fontSize: fontSize });
  }

  onMount(async () => {
    input_buffer = value;

    if (luals) {
      // Register the element-scoped context document so LuaLS types
      // `self`/`element`/`ele` for completion, matching the full-screen
      // editor's scoped suggestions (e.g. encoder-specific methods).
      lualsContextUri = await openEditorContext(restrictScopeTo ?? "");

      // Back the editor with a model that has a `.lua` URI so LuaLS
      // recognises it as a Lua file. An inmemory:// model is treated as
      // unknown and gets no LuaLS-backed completion/hover.
      const modelUri = Uri.parse(
        `file:///grid-editor/${lualsExpressionOnly ? EXPRESSION_FRAGMENT_URI_MARKER.slice(1) : "line-editor-"}${Date.now()}.lua`,
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
      minimap: {
        enabled: false,
      },
      restrictScope: restrictScopeTo,
      readOnly: disabled,
      fontSize: $appSettings.persistent.fontSize,
      lineNumbers: "off",
      lineNumbersMinChars: 0,
      lineDecorationsWidth: 0,
      folding: false,
      glyphMargin: false,
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
      renderLineHighlight: "none",
      wordWrap: "off", // Disable word wrapping
      scrollbar: {
        horizontal: "hidden", // Enable horizontal scrollbar as needed
        vertical: "hidden", // Hide vertical scrollbar
      },
      contextmenu: false,
      scrollPredominantAxis: false,
      scrollBeyondLastLine: false,
      fixedOverflowWidgets: true, // the suggestions, hover info can appear outside of the action block scope
      suggest: {
        showIcons: true,
        showWords: true,
      },
      automaticLayout: true,
    });

    // Size the container to exactly fit the (always single-line) content,
    // instead of stretching to fill the parent row's height. This also
    // re-fires when the font size changes, keeping the height in sync.
    const updateHeight = () => {
      editorHeight = editor.getContentHeight();
      editor.layout({ width: monaco_block.clientWidth, height: editorHeight });
    };
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();

    editor.getModel().onDidChangeContent((event) => {
      //Hackey solutin for filtering out new line characters
      //Currently there is no better solution for this
      //When a new line char is detected, it is replaced with empty strings
      //The setValue triggers this function once again, and that should be filtered out too
      const value = editor.getValue();
      const hasNewLine = /\r|\n/.exec(value);
      if (!newLinesRemoved && hasNewLine) {
        newLinesRemoved = true;
        editor.setValue(value.replace(/[\n\r]/g, ""));
        return;
      }
      if (!newLinesRemoved) {
        const diff = value.length - input_buffer.length;
        if (availableCharacters - diff < 0) {
          editor.setValue(input_buffer);
        } else {
          input_buffer = value;
        }
        dispatch("input", { script: value });
      }
      newLinesRemoved = false;
    });

    //Handler for loosing focus
    editor.onDidBlurEditorWidget(() => {
      const new_value = editor.getValue();
      if (value_buffer !== new_value) {
        value_buffer = new_value;
        dispatch("change", { script: editor.getValue() });
      }
    });
  });

  beforeUpdate(() => {
    //editor?.layout();
  });

  onDestroy(() => {
    if (lualsContextUri) closeEditorContext(lualsContextUri);
    editor?.dispose();
    editorModel?.dispose();
  });

  // Save a reference to the original ResizeObserver
  const OriginalResizeObserver = window.ResizeObserver;

  // Create a new ResizeObserver constructor
  window.ResizeObserver = function (callback) {
    const wrappedCallback = (entries, observer) => {
      callback(entries, observer);
    };

    // Create an instance of the original ResizeObserver
    // with the wrapped callback
    return new OriginalResizeObserver(wrappedCallback);
  };

  // Copy over static methods, if any
  for (let staticMethod in OriginalResizeObserver) {
    if (OriginalResizeObserver.hasOwnProperty(staticMethod)) {
      window.ResizeObserver[staticMethod] =
        OriginalResizeObserver[staticMethod];
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

<div
  id="monaco_container"
  class="grid grid-cols-1 w-full items-center p-1 rounded border border-background-soft bg-background-muted"
>
  <div
    id="line-editor"
    bind:this={monaco_block}
    onclick={(e) => {
      e.preventDefault();
    }}
    onmousedown={(e) => {
      e.preventDefault();
    }}
    style="height: {editorHeight}px"
    class="line-editor pointer-events-auto flex w-full"
  ></div>
</div>

<style global>
  /* Disable readonly overlay message */
  .monaco-editor-overlaymessage {
    display: none !important;
  }
</style>
