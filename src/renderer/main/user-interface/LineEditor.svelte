<script>
  import { appSettings } from "../../runtime/app-helper.store";
  import {
    beforeUpdate,
    createEventDispatcher,
    onDestroy,
    onMount,
  } from "svelte";

  import { monaco_elementtype } from "../../lib/CustomMonaco";

  import { monaco_editor } from "$lib/CustomMonaco";

  const dispatch = createEventDispatcher();

  export let value;
  export let access_tree;
  export let disabled = false;

  let monaco_block;

  let editor;
  let value_buffer = "";
  let newLinesRemoved = false;

  function handleDisabledChange(value) {
    editor.updateOptions({ readOnly: value });
  }

  $: {
    if (typeof editor !== "undefined") {
      handleDisabledChange(disabled);
    }
  }

  onDestroy(() => {
    editor.dispose();
  });

  $: handleFontSizechange($appSettings.persistent.fontSize);

  function handleFontSizechange(fontSize) {
    editor?.updateOptions({ fontSize: fontSize });
  }

  onMount(() => {
    $monaco_elementtype = access_tree.elementtype;
    value_buffer = value;

    editor = monaco_editor.create(monaco_block, {
      value: value,
      language: "intech_lua",
      theme: "my-theme",
      minimap: {
        enabled: false,
      },
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
      scrollBeyondLastLine: 0,
      suggest: {
        showIcons: false,
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
        dispatch("output", { script: value });
      }
      newLinesRemoved = false;
    });

    //Handler for loosing focus
    editor.onDidBlurEditorWidget(() => {
      const new_value = editor.getValue();
      if (value_buffer !== new_value) {
        dispatch("change", { script: editor.getValue() });
      }
      value_buffer = new_value;
    });
  });

  beforeUpdate(() => {
    editor?.layout();
  });

  // Save a reference to the original ResizeObserver
  const OriginalResizeObserver = window.ResizeObserver;

  // Create a new ResizeObserver constructor
  window.ResizeObserver = function (callback) {
    const wrappedCallback = (entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
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
  class="{$$props.class} grid grid-cols-1 w-full h-full items-center"
>
  <div
    id="line-editor"
    on:click|preventDefault={() => {}}
    on:mousedown|preventDefault={() => {}}
    bind:this={monaco_block}
    class="line-editor pointer-events-auto flex w-full h-full"
  />
</div>

<style global>
  /* Disable readonly overlay message */
  .monaco-editor-overlaymessage {
    display: none !important;
  }
</style>
