<script lang="ts">
  import { appSettings } from "../../runtime/app-helper.store";
  import { beforeUpdate, createEventDispatcher, onMount } from "svelte";

  import { ElementType } from "@intechstudio/grid-protocol";
  import { MonacoEditor } from "../../lib/monaco";

  const dispatch = createEventDispatcher();

  export let value;
  export let disabled = false;
  export let availableCharacters = Infinity;
  export let restrictScopeTo: ElementType | undefined = undefined;

  let monaco_block;

  let editor;
  let input_buffer = value;
  let value_buffer = value;
  let newLinesRemoved = false;

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

  onMount(() => {
    input_buffer = value;
    editor = MonacoEditor.create(monaco_block, {
      value: value,
      language: "intech_lua",
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
      suggest: {
        showIcons: true,
        showWords: true,
      },
      automaticLayout: true,
    });

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
  class="grid grid-cols-1 w-full h-full items-center p-1 rounded border border-background-soft bg-background-muted"
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
    class="line-editor pointer-events-auto flex w-full h-full"
  ></div>
</div>

<style global>
  /* Disable readonly overlay message */
  .monaco-editor-overlaymessage {
    display: none !important;
  }
</style>
