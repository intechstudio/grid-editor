<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { onMount } from "svelte";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;

  onMount(() => {
    editor = MonacoEditor.create(monacoElement, {
      value: "",
      language: "intech_lua",
      theme: "my-theme",
      fontSize: $appSettings.persistent.fontSize,
      folding: false,
      renderLineHighlight: "none",
      contextmenu: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: "on",
      suggest: {
        showIcons: false,
        showWords: true,
      },
      minimap: {
        enabled: false,
      },
      lineNumbers: "off",
    });
  });

  function handleSendInmediateclicked() {
    const value = editor.getValue();
    runtime_manager.LUAExecImmediate(0, 0, value);
  }
</script>

<div class="grid grid-cols-[1fr_auto] gap-2 items-center h-32">
  <div
    bind:this={monacoElement}
    class="flex w-full h-full border border-black"
  />
  <MoltenPushButton click={handleSendInmediateclicked} text="Immediate" />
</div>
