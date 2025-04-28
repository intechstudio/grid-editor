<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sec",
    name: "SettingsEncoder",
    rendering: "standard",
    category: "element settings",
    color: "#5F416D",
    displayName: "Encoder Mode",
    defaultLua: "self:emo(0) self:ev0(50)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">EC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">EC</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import {
    MeltCheckbox,
    Block,
    BlockBody,
    MeltCombo,
  } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
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

  const whatsInParenthesis = /\(([^)]+)\)/;

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config) {
    const arr = config.script.split("self:").slice(1);

    const parts = {
      emo: null,
      ev0: null,
      emi: null,
      ema: null,
      ese: null,
    };

    for (const [key, value] of Object.entries(parts)) {
      const index = arr.findIndex((e) => e.includes(key));
      if (index !== -1) {
        parts[key] = whatsInParenthesis.exec(arr[index])[1];
      }
    }

    emo = parts.emo;
    ev0 = parts.ev0;

    minMaxEnabled = !!parts.emi || !!parts.ema;

    if (minMaxEnabled) {
      emi = parts.emi;
      ema = parts.ema;
    }

    sensitivityEnabled = !!parts.ese;
    if (sensitivityEnabled) {
      ese = parts.ese;
    }
  }

  function sendData() {
    const optional = [];

    if (minMaxEnabled) {
      optional.push(`self:emi(${emi}) self:ema(${ema})`);
    }

    if (sensitivityEnabled) {
      optional.push(`self:ese(${ese})`);
    }

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

  let minMaxEnabled = false;
  let sensitivityEnabled = false;

  $: handleMinMaxChange(minMaxEnabled);
  function handleMinMaxChange(value) {
    sendData();
    syncWithGrid();
  }

  $: handleSensitivityChange(sensitivityEnabled);
  function handleSensitivityChange(value) {
    sendData();
    syncWithGrid();
  }

  function syncWithGrid() {
    dispatch("sync");
  }
</script>

<encoder-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    <MeltCombo
      title={"Encoder Mode"}
      bind:value={emo}
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

    <MeltCombo
      title={"Encoder Velocity"}
      bind:value={ev0}
      suggestions={suggestions[1]}
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
  </div>

  <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />

  <Block>
    <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
      <MeltCombo
        title={"Min"}
        disabled={!minMaxEnabled}
        bind:value={emi}
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

      <MeltCombo
        title={"Max"}
        disabled={!minMaxEnabled}
        bind:value={ema}
        validator={validators[3].func}
        suggestions={suggestions[2]}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          validators[3].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </div>

    <MeltCheckbox
      bind:target={sensitivityEnabled}
      title={"Enable Sensitivity"}
    />
    <MeltCombo
      title={"Sensitivity"}
      disabled={!sensitivityEnabled}
      bind:value={ese}
      validator={validators[4].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        validators[4].value = !validationError;
        sendData();
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
    <BlockBody>
      Note: When Min/Max or Sensitivity values are disabled, any changes to the
      default values will only be reset after storing.
    </BlockBody>
  </Block>
</encoder-settings>
