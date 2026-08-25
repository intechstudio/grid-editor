<script lang="ts">
  import { MoltenPushButton, Block, BlockRow } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { onMount } from "svelte";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { grid, GridScript } from "@intechstudio/grid-protocol";
  import {
    InstructionClassName,
    InstructionClass,
  } from "../../../runtime/engine.store";
  import {
    parseEvaluateResponse,
    type LuaValue,
  } from "../../../serialport/evaluate-parser";

  export let target: { dx: number; dy: number };

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;

  let pending = false;
  let status: "ACK" | "NACK" | null = null;
  let messageId: string | null = null;
  let responseValues: LuaValue[] | null = null;

  onMount(() => {
    editor = MonacoEditor.create(monacoElement, {
      value: "return nil",
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

  async function handleSendEvaluate() {
    const runtime = get(runtime_manager).active?.runtime;
    if (!runtime) return;

    const code = editor.getValue();
    const script = `${GridScript.compressScript(code)}`;
    const size = script.length.toString(16).padStart(4, "0");

    const classBody = `\x02086e0001` + `04` + size + script + `\x03`;
    const classArray: number[] = Array.from(classBody, (c) => c.charCodeAt(0));
    classArray.push(0x04);

    const dummyDescr = {
      brc_parameters: { DX: target.dx, DY: target.dy },
      class_name: InstructionClassName.IMMEDIATE,
      class_instr: InstructionClass.EXECUTE,
      class_parameters: { ACTIONLENGTH: 0, ACTIONSTRING: "" },
    };
    const encoded = grid.encode_packet(dummyDescr);
    if (!encoded) return;

    const brcHeader: number[] = encoded.serial.slice(0, 23);
    const messageArray: number[] = [...brcHeader, ...classArray];

    const lenHex = messageArray.length.toString(16).padStart(4, "0");
    for (let i = 0; i < 4; i++) {
      messageArray[2 + i] = lenHex.charCodeAt(i);
    }

    const checksum = messageArray.reduce((a, b) => a ^ b);
    const checksumHex = checksum.toString(16).padStart(2, "0");
    messageArray.push(checksumHex.charCodeAt(0));
    messageArray.push(checksumHex.charCodeAt(1));
    messageArray.push(10);

    pending = true;
    status = null;
    messageId = null;
    responseValues = null;

    try {
      const descr = await runtime.connection.buffer.sendRawDataToGrid(
        new Uint8Array(messageArray),
        {
          dx: target.dx,
          dy: target.dy,
          virtual: runtime.virtual,
          responseRequired: true,
          filter: {
            class_name: "EVALUATE",
            brc_parameters: {},
            class_parameters: {},
          },
          responseTimeout: 2000,
        },
      );
      status = descr.class_instr === "REPORT" ? "ACK" : "NACK";
      messageId = descr.class_parameters.LASTHEADER;
      responseValues = parseEvaluateResponse(descr);
    } catch (e) {
      console.warn("Evaluate failed:", e);
    } finally {
      pending = false;
    }
  }
</script>

<Block>
  <div
    class="flex w-full h-28 border border-black"
    bind:this={monacoElement}
  ></div>
  <BlockRow>
    <MoltenPushButton
      click={handleSendEvaluate}
      text={pending ? "Waiting..." : "Send Evaluate"}
      disabled={pending}
    />
  </BlockRow>

  {#if pending || status !== null}
    <div class="flex flex-col gap-1 mt-1 font-mono text-sm">
      <div class="flex gap-3 items-center">
        <span
          class={status === "ACK"
            ? "text-green-400"
            : status === "NACK"
              ? "text-red-400"
              : "text-gray-400"}
        >
          {pending ? "pending" : status}
        </span>
        {#if messageId !== null}
          <span class="text-gray-400">id: {messageId}</span>
        {/if}
      </div>
      {#if responseValues !== null}
        <pre
          class="text-white whitespace-pre-wrap break-all select-text">{JSON.stringify(
            responseValues,
            null,
            2,
          )}</pre>
      {/if}
    </div>
  {/if}
</Block>
