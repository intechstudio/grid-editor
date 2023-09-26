<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";

  import { monaco_elementtype } from "../../lib/CustomMonaco";

  import { monaco_editor } from "$lib/CustomMonaco";

  const dispatch = createEventDispatcher();

  export let value;
  export let access_tree;
  export let sidebarWidth;

  let monaco_block;

  let editor;
  let value_buffer = "";

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
      automaticLayout: false,
    });

    editor.onKeyDown((e) => {
      if (e.code === "Enter") {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    update_codeblock_size();

    editor.getModel().onDidChangeContent((event) => {
      dispatch("output", { script: editor.getValue() });

      update_codeblock_size();
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
<div
  on:click|preventDefault={() => {}}
  on:mousedown|preventDefault={() => {}}
  bind:this={monaco_block}
  class="line-editor {$$props.class} grid grid-cols-1 w-full"
/>
