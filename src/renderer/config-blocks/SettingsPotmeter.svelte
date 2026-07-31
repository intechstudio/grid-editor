<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "spc",
    name: "SettingsPotmeter",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/element-settings/potmeter-mode/",
    category: "element settings",
    color: categoryColors["element settings"] as any,
    displayName: "Potmeter Mode",
    description: "Configure the potentiometer range",
    defaultLua: "self:pmo(7) self:pmi(0) self:pma(127)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M6 18.2a8.5 8.5 0 1 1 12 0"/><path d="M12 12 8.6 15.4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
  import { Block, BlockRow, MeltCombo } from "@intechstudio/grid-uikit";
  import { ActionData, GridAction } from "../runtime/runtime.js";
  import { extractParam } from "./_script_parsers.js";

  export let action: GridAction;

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

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    pmo = extractParam(data.script, "pmo");

    const newPmi = extractParam(data.script, "pmi");
    const newPma = extractParam(data.script, "pma");
    if (!!newPmi || !!newPma) {
      pmi = newPmi;
      pma = newPma;
    }
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function sendData() {
    validators[0].value = validators[0].func(pmo);
    validators[1].value = validators[1].func(pmi);
    validators[2].value = validators[2].func(pma);
    const optional = [];

    optional.push(`self:pmi(${pmi})  self:pma(${pma})`);

    dispatch("update-action", {
      short: "spc",
      script:
        `self:pmo(${pmo})` +
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

  function calculateStepSize(bit, min, max) {
    return ((max - min + 1) / Math.pow(2, bit)).toFixed(2);
  }

  let stepSize;
  $: stepSize = calculateStepSize(Number(pmo), Number(pmi), Number(pma));
</script>

<potmeter-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <Block>
    <MeltCombo
      title={"Bit depth"}
      value={pmo}
      suggestions={suggestions[0]}
      validator={validators[0].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        pmo = value;
        validators[0].value = !validationError;
        sendData();
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <BlockRow>
      <MeltCombo
        title={"Min"}
        value={pmi}
        validator={validators[1].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          pmi = value;
          validators[1].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        value={pma}
        suggestions={suggestions[1]}
        validator={validators[2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          pma = value;
          validators[2].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </BlockRow>
  </Block>

  <div class="flex flex-row gap-2">
    <span class="text-gray-500 text-sm">Step size:</span>
    <span class="text-white text-sm">{stepSize}</span>
  </div>
</potmeter-settings>
