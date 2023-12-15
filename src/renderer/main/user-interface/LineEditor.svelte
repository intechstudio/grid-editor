<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  import { monaco_elementtype } from "../../lib/CustomMonaco";

  import { monaco_editor } from "$lib/CustomMonaco";

  const dispatch = createEventDispatcher();

  export let value;
  export let access_tree;
  export let sidebarWidth;
  export let disabled = false;

  let monaco_block;

  let editor;
  let value_buffer = "";
  let newLinesRemoved = false;

  $: {
    if (sidebarWidth) {
      update_codeblock_size();
    }
  }

  function update_codeblock_size() {
    if (typeof editor === "undefined") {
      return;
    }

    //console.log(editor._getViewModel().getLineCount(), editor._modelData.viewModel)
    //editor.viewModel.getViewLineCount()

    const contentHeight = editor._getViewModel().getLineCount() * 16;

    monaco_block.style.height = contentHeight + "px";
    editor.layout();
  }

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
      fontSize: 12,
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

    update_codeblock_size();

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
        update_codeblock_size();
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
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div id="monaco_container" class="{$$props.class} grid grid-cols-1 w-full">
  <div
    on:click|preventDefault={() => {}}
    on:mousedown|preventDefault={() => {}}
    bind:this={monaco_block}
    class="line-editor pointer-events-auto w-full"
  />
</div>

<style global>
  /* Disable readonly overlay message */
  .monaco-editor-overlaymessage {
    display: none !important;
  }
</style>
