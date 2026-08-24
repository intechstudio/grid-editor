<script lang="ts">
  import { MoltenPushButton, Block, BlockRow } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { GridInstruction } from "../../../serialport/instructions";
  import { onMount } from "svelte";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { GridScript } from "@intechstudio/grid-protocol";

  export let target: { dx: number; dy: number };

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;

  onMount(() => {
    editor = MonacoEditor.create(monacoElement, {
      value: 'print("INFO: hello")',
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
      suggest: { showIcons: false, showWords: true },
      minimap: { enabled: false },
      lineNumbers: "off",
    });
  });

  $: if (editor) {
    MonacoEditor.setTheme(
      $appSettings.persistent.lightMode
        ? MonacoEditor.Theme.LIGHT
        : MonacoEditor.Theme.DARK,
    );
  }

  function handleSendImmediateclicked() {
    const runtime = get(runtime_manager).active?.runtime;
    if (!runtime) return;

    const instruction = new GridInstruction.SendConfigImmediate(
      target.dx,
      target.dy,
      GridScript.compressScript(editor.getValue()),
      runtime.virtual,
    );
    instruction.executeOn(runtime.connection).catch((e) => {
      console.warn(e);
    });
  }
</script>

<Block>
  <div
    class="flex w-full h-28 border border-black"
    bind:this={monacoElement}
  ></div>
  <BlockRow>
    <MoltenPushButton
      click={handleSendImmediateclicked}
      text="Send Immediate"
    />
  </BlockRow>
</Block>
