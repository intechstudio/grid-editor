<script lang="ts">
  import { MoltenPushButton } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { GridInstruction } from "../../../serialport/instructions";
  import { onMount } from "svelte";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { logger } from "../../../runtime/runtime.store";
  import { Runtime } from "../../../runtime/string-table";

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;

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

  $: if (editor) {
    handleLightModeChange($appSettings.persistent.lightMode);
  }

  function handleLightModeChange(value: boolean) {
    MonacoEditor.setTheme(
      value ? MonacoEditor.Theme.LIGHT : MonacoEditor.Theme.DARK,
    );
  }

  function handleSendImmediateclicked() {
    const value = editor.getValue();
    const module = get(runtime_manager).active?.runtime.findModule(0, 0);
    if (!module) {
      logger.set({
        type: "fail",
        classname: "pagechange",
        mode: 0,
        message: Runtime.ErrorText.SEND_IMMEDIATE_NO_ACTIVE_MODULE,
      });
      return;
    }
    module.execLUAImmediate(value);
  }
</script>

<div class="grid grid-cols-[1fr_auto] gap-2 items-center h-32">
  <div
    bind:this={monacoElement}
    class="flex w-full h-full border border-black"
  />
  <MoltenPushButton click={handleSendImmediateclicked} text="Immediate" />
</div>
