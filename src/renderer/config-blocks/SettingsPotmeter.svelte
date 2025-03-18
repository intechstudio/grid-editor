<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "spc",
    name: "SettingsPotmeter",
    rendering: "standard",
    category: "element settings",
    color: "#5F416D",
    displayName: "Potmeter Mode",
    defaultLua: "self:pmo(7)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">PC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">PC</span>`,
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

  let pmo = ""; // local script part

  let pma = "127";
  let pmi = "0";

  const whatsInParenthesis = /\(([^)]+)\)/;

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config) {
    const arr = config.script.split("self:").slice(1);
    const parts = {
      pmo: null,
      pma: null,
      pmi: null,
    };
    for (const [key, value] of Object.entries(parts)) {
      const index = arr.findIndex((e) => e.includes(key));
      if (index !== -1) {
        parts[key] = whatsInParenthesis.exec(arr[index])[1];
      }
    }

    pmo = parts.pmo;

    minMaxEnabled = !!parts.pmi || !!parts.pma;
    if (minMaxEnabled) {
      pmi = parts.pmi;
      pma = parts.pma;
    }
  }

  $: sendData(pmo, pmi, pma);

  $: handleMinMaxChange(minMaxEnabled);
  function handleMinMaxChange(value) {
    sendData(pmo, pmi, pma);
    syncWithGrid();
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function sendData(p1, p2, p3) {
    const optional = [];

    if (minMaxEnabled) {
      optional.push(`self:pmi(${p2})  self:pma(${p3})`);
    }

    dispatch("update-action", {
      short: "spc",
      script:
        `self:pmo(${p1})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
      validationError: validators.some((e) => e.value === false),
    });
  }

  const suggestions = [
    [
      { value: "7", info: "7 bit (default)" },
      { value: "8", info: "8 bit" },
      { value: "9", info: "9 bit" },
      { value: "10", info: "10 bit" },
      { value: "11", info: "11 bit (not recommended)" },
      { value: "12", info: "12 bit (not recommended)" },
    ],

    [
      { value: "127", info: "7 bit MIDI (default)" },
      { value: "16383", info: "14 bit MIDI (high res)" },
    ],
  ];

  let minMaxEnabled = false;

  function calculateStepSize(bit, min, max) {
    return ((max - min + 1) / Math.pow(2, bit)).toFixed(2);
  }

  let stepSize;
  $: stepSize = calculateStepSize(
    Number(pmo),
    minMaxEnabled ? Number(pmi) : 0,
    minMaxEnabled ? Number(pma) : 127,
  );
</script>

<potmeter-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <MeltCombo
    title={"Bit depth"}
    bind:value={pmo}
    suggestions={suggestions[0]}
    validator={validators[0].func}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      validators[0].value = !validationError;
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
        bind:value={pmi}
        validator={validators[1].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          validators[1].value = !validationError;
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        disabled={!minMaxEnabled}
        bind:value={pma}
        suggestions={suggestions[1]}
        validator={validators[2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          validators[2].value = !validationError;
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

  {#if minMaxEnabled}
    <div class="flex flex-row gap-2">
      <span class="text-gray-500 text-sm">Step size:</span>
      <span class="text-white text-sm">{stepSize}</span>
    </div>
  {/if}
</potmeter-settings>
