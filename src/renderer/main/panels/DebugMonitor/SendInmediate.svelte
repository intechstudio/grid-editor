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
  import CalibrationButton from "./CalibrationButton.svelte";

  let monacoElement: HTMLElement;
  let editor: MonacoEditor.CustomCodeEditor;
  let selectedModule: string = "all";
  let moduleOptions: Array<{ title: string; value: string }> = [];
  let hasCenterCalibration: boolean = false;
  let hasRangeCalibration: boolean = false;
  let hasDetentCalibration: boolean = false;

  onMount(() => {
    editor = MonacoEditor.create(monacoElement, {
      value: 'print("hello")',
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

  // Check what calibrations the selected module supports
  // - Potmeters: Center, Range, Detent Low, Detent High
  // - Buttons: Range only (RevH revision only)
  // - Other elements: no calibration
  $: {
    if (selectedModule === "all") {
      hasCenterCalibration = false;
      hasRangeCalibration = false;
      hasDetentCalibration = false;
    } else {
      const runtime = get(runtime_manager)?.active?.runtime;
      if (runtime) {
        const [dxStr, dyStr] = selectedModule.split(",");
        const dxNum = parseInt(dxStr) || 0;
        const dyNum = parseInt(dyStr) || 0;
        const module = runtime.findModule(dxNum, dyNum);
        if (module) {
          const elementList = grid.get_module_element_list(module.type);
          const hasPotmeter = elementList.some(
            (element) => element === "potmeter",
          );
          const hasButton = elementList.some((element) => element === "button");
          const isRevH = module.revision === "RevH";

          hasCenterCalibration = hasPotmeter;
          hasRangeCalibration = hasPotmeter || (hasButton && isRevH);
          hasDetentCalibration = hasPotmeter;
        } else {
          hasCenterCalibration = false;
          hasRangeCalibration = false;
          hasDetentCalibration = false;
        }
      } else {
        hasCenterCalibration = false;
        hasRangeCalibration = false;
        hasDetentCalibration = false;
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
  <BlockTitle>Generate Calibration</BlockTitle>
  <BlockRow>
    <CalibrationButton
      text="Center"
      code="local caldata = gpcg() gpcs(caldata) print(table.unpack(caldata))"
      onClick={sendLuaCode}
      disabled={!hasCenterCalibration}
    />
    <CalibrationButton
      text="Range"
      code="local caldata = grcg() grcs(caldata) print(table.unpack(caldata))"
      onClick={sendLuaCode}
      disabled={!hasRangeCalibration}
    />
    <CalibrationButton
      text="Detent Low"
      code="local caldata = gpcg() gpds(caldata, false) print(table.unpack(caldata))"
      onClick={sendLuaCode}
      disabled={!hasDetentCalibration}
    />
    <CalibrationButton
      text="Detent High"
      code="local caldata = gpcg() gpds(caldata, true) print(table.unpack(caldata))"
      onClick={sendLuaCode}
      disabled={!hasDetentCalibration}
    />
  </BlockRow>
  <BlockTitle>Clear Calibration</BlockTitle>
  <BlockRow>
    <CalibrationButton
      text="Center"
      code="gpcs(nil)"
      onClick={sendLuaCode}
      disabled={!hasCenterCalibration}
    />
    <CalibrationButton
      text="Range"
      code="grcs(nil)"
      onClick={sendLuaCode}
      disabled={!hasRangeCalibration}
    />
    <CalibrationButton
      text="Detent Low"
      code="gpds(nil, false)"
      onClick={sendLuaCode}
      disabled={!hasDetentCalibration}
    />
    <CalibrationButton
      text="Detent High"
      code="gpds(nil, true)"
      onClick={sendLuaCode}
      disabled={!hasDetentCalibration}
    />
  </BlockRow>
</Block>
