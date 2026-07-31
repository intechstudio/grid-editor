<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "rse",
    name: "ResetEncoder",
    category: "special",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/element-settings/encoder-mode",
    color: categoryColors["special"] as any,
    displayName: "Reset Encoder",
    description: "",
    defaultLua: "self:eva(0) self:get(2)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 12a9 9 0 1 0 9-9c-2.52 0-4.93 1-6.74 2.74L3 8"/><path d="M3 3v5h5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    devOnly: true,
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { MeltCombo, MeltCheckbox } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { GridAction } from "./../runtime/runtime";
  import { get } from "svelte/store";
  import { ResetEncoder } from "./ResetEncoder";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  const data = new ResetEncoder.ViewModel(config);

  onDestroy(() => {
    data.destroy();
  });

  $: if (!$config.invalid) {
    handleConfigChange(config);
  }

  function handleConfigChange(action: GridAction) {
    if (config.script === buildScript($data)) {
      return;
    }

    data.updateData(action);
  }

  function buildScript(data: ResetEncoder.ViewModelData) {
    return `${data.element.value}:eva(${data.rotationValue.value}) self:get(2)`;
  }

  function sendData(data: ResetEncoder.ViewModelData) {
    const script = buildScript(data);
    const validators = [data.element.validator, data.rotationValue.validator];

    dispatch("update-action", {
      short: config.short,
      script: script,
      validationError: validators.some((e) => e.value === false),
    });
  }
</script>

<config-led-color class="flex flex-col gap-4 w-full p-2 pointer-events-auto">
  <div class="flex flex-row w-full gap-2">
    <MeltCombo
      title={"Element"}
      value={$data.element.value}
      validator={$data.element.validator.func}
      suggestions={$data.element.suggestions}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        $data.element.value = value;
        $data.element.validator.value = !validationError;
        sendData($data);
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Rotation Value"}
      value={$data.rotationValue.value}
      validator={$data.rotationValue.validator.func}
      suggestions={$data.rotationValue.suggestions}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        $data.rotationValue.value = value;
        $data.rotationValue.validator.value = !validationError;
        sendData($data);
      }}
      on:change={() => dispatch("sync")}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </div>
</config-led-color>
