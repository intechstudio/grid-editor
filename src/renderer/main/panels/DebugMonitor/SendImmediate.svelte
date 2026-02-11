<script lang="ts">
  import {
    MoltenPushButton,
    MoltenInput,
    MeltSelect,
    Block,
    BlockRow,
  } from "@intechstudio/grid-uikit";
  import { runtime_manager } from "../../../runtime/runtime-manager.store";
  import { GridInstruction } from "../../../serialport/instructions";
  import { onMount } from "svelte";
  import { MonacoEditor } from "../../../lib/monaco";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { logger } from "../../../runtime/runtime.store";
  import { Runtime } from "../../../runtime/string-table";
  import type { ModuleType } from "@intechstudio/grid-protocol";
  import { grid, GridScript } from "@intechstudio/grid-protocol";
  import {
    InstructionClassName,
    InstructionClass,
  } from "../../../runtime/engine.store";

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;
  let selectedModule: string = "all";
  let moduleOptions: Array<{ title: string; value: string }> = [];

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
      suggest: {
        showIcons: false,
        showWords: true,
      },
      minimap: {
        enabled: false,
      },
      lineNumbers: "off",
    });

    // Initial module list population
    refreshModuleList();
  });

  $: if (editor) {
    handleLightModeChange($appSettings.persistent.lightMode);
  }

  function handleLightModeChange(value: boolean) {
    MonacoEditor.setTheme(
      value ? MonacoEditor.Theme.LIGHT : MonacoEditor.Theme.DARK,
    );
  }

  function refreshModuleList() {
    const runtime = get(runtime_manager)?.active?.runtime;
    const modules = runtime?.modules || [];

    const newOptions = [
      { title: "All Modules (Global)", value: "all" },
      ...modules.map((module) => ({
        title: `Module [${module.dx}, ${module.dy}] - ${getModuleTypeName(module.type)}`,
        value: `${module.dx},${module.dy}`,
      })),
    ];

    // Check if selected module still exists
    if (selectedModule !== "all") {
      const selectedExists = newOptions.some(
        (opt) => opt.value === selectedModule,
      );
      if (!selectedExists) {
        selectedModule = "all";
      }
    }

    moduleOptions = newOptions;
  }

  function getModuleTypeName(type: ModuleType): string {
    if (typeof type === "object" && type.type) {
      return type.type;
    }
    return String(type);
  }

  function getActiveRuntime() {
    const runtime = get(runtime_manager).active?.runtime;
    if (!runtime) {
      logger.set({
        type: "fail",
        classname: "pagechange",
        mode: 0,
        message: Runtime.ErrorText.SEND_IMMEDIATE_NO_ACTIVE_MODULE,
      });
    }
    return runtime;
  }

  function getSelectedTarget(
    runtime: import("../../../runtime/runtime").GridRuntime,
  ): { dx: number; dy: number } | null {
    if (selectedModule === "all") {
      return { dx: -127, dy: -127 };
    } else {
      const [dxStr, dyStr] = selectedModule.split(",");
      const dx = parseInt(dxStr) || 0;
      const dy = parseInt(dyStr) || 0;
      const module = runtime.findModule(dx, dy);
      if (!module) {
        logger.set({
          type: "fail",
          classname: "pagechange",
          mode: 0,
          message: Runtime.ErrorText.SEND_IMMEDIATE_NO_ACTIVE_MODULE,
        });
        return null;
      }
      return { dx, dy };
    }
  }

  function sendLuaCode(code: string) {
    const runtime = getActiveRuntime();
    if (!runtime) return;
    const target = getSelectedTarget(runtime);
    if (!target) return;

    const instruction = new GridInstruction.SendConfigImmediate(
      target.dx,
      target.dy,
      GridScript.compressScript(code),
      runtime.virtual,
    );
    instruction.executeOn(runtime.connection).catch((e) => {
      console.warn(e);
    });
  }

  function handleSendImmediateclicked() {
    const value = editor.getValue();
    sendLuaCode(value);
  }

  let rawInput = `\x02085e001b<?lua print("INFO: foo") ?>\x03`;

  async function handleSendRawClicked() {
    const runtime = getActiveRuntime();
    if (!runtime) return;
    const target = getSelectedTarget(runtime);
    if (!target) return;

    await sendRawPacket(runtime, target.dx, target.dy);
  }

  async function sendRawPacket(
    runtime: import("../../../runtime/runtime").GridRuntime,
    dx: number,
    dy: number,
  ) {
    // Generate BRC header using a dummy encode_packet call
    const dummyDescr = {
      brc_parameters: { DX: dx, DY: dy },
      class_name: InstructionClassName.IMMEDIATE,
      class_instr: InstructionClass.EXECUTE,
      class_parameters: { ACTIONLENGTH: 0, ACTIONSTRING: "" },
    };
    const encoded = grid.encode_packet(dummyDescr);
    if (!encoded) {
      console.warn("Failed to encode BRC header");
      return;
    }

    // Extract BRC header (first 23 bytes: SOH + BRC params + EOB)
    const brcHeader = encoded.serial.slice(0, 23);

    // Convert raw input string to ASCII code array
    const classArray: number[] = [];
    for (let i = 0; i < rawInput.length; i++) {
      classArray.push(rawInput.charCodeAt(i));
    }

    // Ensure ETX is followed by EOT
    if (classArray[classArray.length - 1] === 0x03) {
      classArray.push(0x04); // EOT
    } else if (classArray[classArray.length - 1] !== 0x04) {
      classArray.push(0x03); // ETX
      classArray.push(0x04); // EOT
    }

    // Combine BRC header + class section
    const messageArray = [...brcHeader, ...classArray];

    // Write packet length into BRC LEN field (offset 2, length 4)
    const len = messageArray.length;
    const lenHex = len.toString(16).padStart(4, "0");
    for (let i = 0; i < 4; i++) {
      messageArray[2 + i] = lenHex.charCodeAt(i);
    }

    // Calculate XOR checksum
    const checksum = messageArray.reduce((a, b) => a ^ b);
    const checksumHex = checksum.toString(16).padStart(2, "0");
    messageArray.push(checksumHex.charCodeAt(0));
    messageArray.push(checksumHex.charCodeAt(1));

    // Add newline terminator (required by frame detection)
    messageArray.push(10);

    // Send through the buffer queue (respects write lock)
    const data = new Uint8Array(messageArray);
    try {
      await runtime.connection.buffer.sendRawToTransport(data);
    } catch (e) {
      console.warn("Failed to send raw packet:", e);
    }
  }
</script>

<Block>
  <BlockRow>
    <div class="flex-grow">
      {#key moduleOptions}
        <MeltSelect
          bind:target={selectedModule}
          options={moduleOptions}
          disabled={false}
        />
      {/key}
    </div>
    <MoltenPushButton click={refreshModuleList} text="Refresh List" />
  </BlockRow>
  <div class="flex w-full h-28 border border-black" bind:this={monacoElement} />
  <BlockRow>
    <MoltenPushButton
      click={handleSendImmediateclicked}
      text="Send Immediate"
    />
  </BlockRow>
  <BlockRow>
    <div class="flex-grow">
      <MoltenInput bind:target={rawInput} placeholder="Enter raw command..." />
    </div>
    <MoltenPushButton click={handleSendRawClicked} text="Send" />
  </BlockRow>
</Block>
