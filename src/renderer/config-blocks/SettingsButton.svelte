<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sbc",
    name: "SettingsButton",
    rendering: "standard",
    category: "element settings",
    displayName: "Button Mode",
    color: "#5F416D",
    defaultLua: "self:bmo(0)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
  import {
    MeltCheckbox,
    Block,
    BlockBody,
    MeltCombo,
  } from "@intechstudio/grid-uikit";
  import { GridAction } from "../runtime/runtime.js";

  export let config: GridAction;

  const dispatch = createEventDispatcher();

  const validators = [
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
  ];

  const whatsInParenthesis = /\(([^)]+)\)/;
  let bmo = "";
  let bmi = "0";
  let bma = "127";

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config) {
    const arr = config.script.split("self:").slice(1);
    const parts = {
      bmo: null,
      bmi: null,
      bma: null,
    };

    for (const [key, value] of Object.entries(parts)) {
      const index = arr.findIndex((e) => e.includes(key));
      if (index !== -1) {
        parts[key] = whatsInParenthesis.exec(arr[index])[1];
      }
    }

    bmo = parts.bmo;

    minMaxEnabled = !!parts.bmi || !!parts.bma;
    if (minMaxEnabled) {
      bmi = parts.bmi;
      bma = parts.bma;
    }
  }

  $: handleMinMaxChange(minMaxEnabled);
  function handleMinMaxChange(value) {
    sendData();
    syncWithGrid();
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function sendData() {
    const optional = [];
    if (minMaxEnabled) {
      optional.push(`self:bmi(${bmi}) self:bma(${bmo})`);
    }

    dispatch("update-action", {
      short: `sbc`,
      script:
        `self:bmo(${bmo})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
      validationError: validators.some((e) => e.value === false),
    });
  }

  const suggestions = [
    [
      { value: "0", info: "Momentary" },
      { value: "1", info: "Toggle" },
      { value: "2", info: "3-step" },
      { value: "3", info: "4-step" },
    ],
  ];

  let minMaxEnabled = false;

  function calculateStepValues(steps: number, min: number, max: number) {
    const stepValue = Math.floor(Math.abs(min - max) / (steps - 1));
    const res = Array.from(
      { length: steps },
      (_, index) => min + index * stepValue,
    );
    return res;
  }

  let stepValues: number[];
  $: stepValues = calculateStepValues(
    Number(bmo) + 1,
    minMaxEnabled ? Number(bmi) : 0,
    minMaxEnabled ? Number(bma) : 127,
  );
</script>

<encoder-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <MeltCombo
    title={"Button Mode"}
    bind:value={bmo}
    suggestions={suggestions[0]}
    validator={validators[0].func}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      validators[0].value = !validationError;
      sendData();
    }}
    on:change={syncWithGrid}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <Block>
    <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />
    <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
      <MeltCombo
        title={"Min"}
        disabled={!minMaxEnabled}
        bind:value={bmi}
        validator={validators[1].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          validators[1].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        disabled={!minMaxEnabled}
        bind:value={bma}
        validator={validators[2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          validators[2].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </div>

    <BlockBody>
      Note: When Min/Max values are disabled, any changes to the default values
      will only be reset after storing.
    </BlockBody>
  </Block>

  <div
    class="flex flex-row gap-2"
    class:invisible={!minMaxEnabled || Number(bmo) === 0}
  >
    <span class="text-gray-500 text-sm">Step values:</span>
    <div class="text-white text-sm">
      {#each stepValues as step, i}
        <span>{step}</span>
        <span class:hidden={i === stepValues.length - 1} class="mr-2">,</span>
      {/each}
    </div>
  </div>
</encoder-settings>
