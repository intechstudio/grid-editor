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
    color: categoryColors["special"] as any,
    displayName: "Reset Encoder",
    defaultLua: "self:eva(0) self:get(2)",
    icon: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="#000000" viewBox="2 2 17 17"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g fill="none" fill-rule="evenodd" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" transform="matrix(0 1 1 0 2.5 2.5)"> <path d="m3.98652376 1.07807068c-2.38377179 1.38514556-3.98652376 3.96636605-3.98652376 6.92192932 0 4.418278 3.581722 8 8 8s8-3.581722 8-8-3.581722-8-8-8"></path> <circle cx="8" cy="8" fill="#000000" r="2"></circle> <path d="m4 1v4h-4" transform="matrix(1 0 0 -1 0 6)"></path> </g> </g></svg>
    `,
    blockIcon: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="#000000" viewBox="2 2 17 17"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g fill="none" fill-rule="evenodd" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" transform="matrix(0 1 1 0 2.5 2.5)"> <path d="m3.98652376 1.07807068c-2.38377179 1.38514556-3.98652376 3.96636605-3.98652376 6.92192932 0 4.418278 3.581722 8 8 8s8-3.581722 8-8-3.581722-8-8-8"></path> <circle cx="8" cy="8" fill="#000000" r="2"></circle> <path d="m4 1v4h-4" transform="matrix(1 0 0 -1 0 6)"></path> </g> </g></svg>
    `,
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
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
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
  <SendFeedback feedback_context="LedColor" class="text-sm text-gray-500" />
</config-led-color>
