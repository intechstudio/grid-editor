<script lang="ts">
  import { run } from 'svelte/legacy';

  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { onMount } from "svelte";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";

  let monacoElement: HTMLElement = $state();
  let editor: MonacoEditor.CustomCodeEditor = $state();

  onMount(() => {
    editor = MonacoEditor.create(monacoElement, {
      value: "",
      language: "lua",
      theme: $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
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


  function handleLightModeChange(value: boolean) {
    MonacoEditor.setTheme(
      value ? MonacoEditor.Theme.LIGHT : MonacoEditor.Theme.DARK,
    );
  }

  function handleSendInmediateclicked() {
    const value = editor.getValue();
    runtime_manager.LUAExecImmediate(0, 0, value);
  }
  run(() => {
    if (editor) {
      handleLightModeChange($appSettings.persistent.lightMode);
    }
  });
</script>

<div class="grid grid-cols-[1fr_auto] gap-2 items-center h-32">
  <div
    bind:this={monacoElement}
    class="flex w-full h-full border border-black"
></div>
  <MoltenPushButton click={handleSendInmediateclicked} text="Immediate" />
</div>
