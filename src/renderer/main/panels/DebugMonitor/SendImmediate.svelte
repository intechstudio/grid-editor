<script lang="ts">
  import {
    MoltenPushButton,
    MeltSelect,
    Block,
    BlockRow,
    BlockTitle,
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
  import { grid } from "@intechstudio/grid-protocol";
  import type { GridModule } from "../../../runtime/runtime";
  import CalibrationButtons from "./CalibrationButtons.svelte";

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;
  let selectedModule: string = "all";
  let moduleOptions: Array<{ title: string; value: string }> = [];
  let currentModule: GridModule | undefined = undefined;

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

  function sendLuaCode(code: string) {
    const runtime = get(runtime_manager).active?.runtime;

    if (!runtime) {
      logger.set({
        type: "fail",
        classname: "pagechange",
        mode: 0,
        message: Runtime.ErrorText.SEND_IMMEDIATE_NO_ACTIVE_MODULE,
      });
      return;
    }

    if (selectedModule === "all") {
      // Send to all modules
      const modules = runtime.modules;
      if (modules.length === 0) {
        logger.set({
          type: "fail",
          classname: "pagechange",
          mode: 0,
          message: Runtime.ErrorText.SEND_IMMEDIATE_NO_ACTIVE_MODULE,
        });
        return;
      }
      modules.forEach((module) => {
        module.execLUAImmediate(code);
      });
    } else {
      // Send to specific module
      const [dxStr, dyStr] = selectedModule.split(",");
      const dxNum = parseInt(dxStr) || 0;
      const dyNum = parseInt(dyStr) || 0;
      const module = runtime.findModule(dxNum, dyNum);
      if (!module) {
        logger.set({
          type: "fail",
          classname: "pagechange",
          mode: 0,
          message: Runtime.ErrorText.SEND_IMMEDIATE_NO_ACTIVE_MODULE,
        });
        return;
      }
      module.execLUAImmediate(code);
    }
  }

  function handleSendImmediateclicked() {
    const value = editor.getValue();
    sendLuaCode(value);
  }

  // Get the current module for calibration
  $: {
    if (!selectedModule || selectedModule === "all") {
      currentModule = undefined;
    } else {
      const runtime = get(runtime_manager)?.active?.runtime;
      if (runtime) {
        const [dxStr, dyStr] = selectedModule.split(",");
        const dxNum = parseInt(dxStr) || 0;
        const dyNum = parseInt(dyStr) || 0;
        currentModule = runtime.findModule(dxNum, dyNum);
      } else {
        currentModule = undefined;
      }
    }
  }
</script>

<Block>
  <div class="flex w-full h-28 border border-black" bind:this={monacoElement} />
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
    <MoltenPushButton
      click={handleSendImmediateclicked}
      text="Send Immediate"
    />
  </BlockRow>
  <BlockTitle>Calibration options</BlockTitle>
  <CalibrationButtons module={currentModule} onCalibrate={sendLuaCode} />
</Block>
