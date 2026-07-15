<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "sec",
    name: "SettingsEncoder",
    rendering: "standard",
    category: "element settings",
    color: categoryColors["element settings"] as any,
    displayName: "Encoder Mode",
    description: "Configure how the encoder responds",
    defaultLua:
      "self:emo(0) self:ev0(50) self:emi(0) self:ema(127) self:ese(100)",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="m12 12 3.4-4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="m12 12 3.4-4.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>`,
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
  import { Block, BlockRow, MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
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

  let emo = ""; // local script part
  let ev0 = "";

  let emi = "0";
  let ema = "127";
  let ese = "100";

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    emo = extractParam(data.script, "emo");
    ev0 = extractParam(data.script, "ev0");

    const newEmi = extractParam(data.script, "emi");
    const newEma = extractParam(data.script, "ema");
    if (!!newEmi || !!newEma) {
      emi = newEmi;
      ema = newEma;
    }

    const newEse = extractParam(data.script, "ese");
    if (!!newEse) {
      ese = newEse;
    }
  }

  function sendData() {
    validators[0].value = validators[0].func(emo);
    validators[1].value = validators[1].func(ev0);
    validators[2].value = validators[2].func(emi);
    validators[3].value = validators[3].func(ema);
    validators[4].value = validators[4].func(ese);
    const optional = [];

    optional.push(`self:emi(${emi}) self:ema(${ema})`);

    optional.push(`self:ese(${ese})`);

    dispatch("update-action", {
      short: `sec`,
      script:
        `self:emo(${emo}) self:ev0(${ev0})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
      validationError: validators.some((e) => e.value === false),
    });
  }

  const suggestions = [
    [
      { value: "0", info: "Absolute" },
      { value: "1", info: "Relative BinOffset" },
      { value: "2", info: "Relative 2's Comp" },
    ],

    [
      { value: "0", info: "No velocity (0%)" },
      { value: "50", info: "Default (50%)" },
      { value: "100", info: "Maximum (100%)" },
    ],
    [
      { value: "127", info: "7 bit MIDI (default)" },
      { value: "16383", info: "14 bit MIDI (high res)" },
    ],
  ];

  function syncWithGrid() {
    dispatch("sync");
  }
</script>

<encoder-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <BlockRow>
    <MeltCombo
      title={"Encoder Mode"}
      value={emo}
      suggestions={suggestions[0]}
      validator={validators[0].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        emo = value;
        validators[0].value = !validationError;
        sendData();
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Encoder Velocity"}
      value={ev0}
      suggestions={suggestions[1]}
      validator={validators[1].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        ev0 = value;
        validators[1].value = !validationError;
        sendData();
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </BlockRow>

  <Block>
    <BlockRow>
      <MeltCombo
        title={"Min"}
        value={emi}
        validator={validators[2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          emi = value;
          validators[2].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        value={ema}
        validator={validators[3].func}
        suggestions={suggestions[2]}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          ema = value;
          validators[3].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </BlockRow>

    <MeltCombo
      title={"Sensitivity"}
      value={ese}
      validator={validators[4].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        ese = value;
        validators[4].value = !validationError;
        sendData();
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </Block>
</encoder-settings>
