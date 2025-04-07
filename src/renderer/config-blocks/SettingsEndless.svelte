<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.js";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sen",
    name: "SettingsEndless",
    rendering: "standard",
    category: "element settings",
    color: "#5F416D",
    displayName: "Endless Mode",
    defaultLua: "self:epmo(0) self:epv0(50)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">EP</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">EP</span>`,
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

  let epmo = ""; // local script part
  let epv0 = "";

  let epmi = "0";
  let epma = "16383";
  let epse = "50";

  const whatsInParenthesis = /\(([^)]+)\)/;

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config) {
    const arr = config.script.split("self:").slice(1);
    const parts = {
      epmo: null,
      epv0: null,
      epmi: null,
      epma: null,
      epse: null,
    };

    for (const [key, value] of Object.entries(parts)) {
      const index = arr.findIndex((e) => e.includes(key));
      if (index !== -1) {
        parts[key] = whatsInParenthesis.exec(arr[index])[1];
      }
    }

    epmo = parts.epmo;
    epv0 = parts.epv0;

    minMaxEnabled = !!parts.epmi || !!parts.epma;
    if (minMaxEnabled) {
      epmi = parts.epmi;
      epma = parts.epma;
    }

    sensitivityEnabled = !!parts.epse;
    if (sensitivityEnabled) {
      epse = parts.epse;
    }
  }

  $: sendData(epmo, epv0, epmi, epma, epse);

  $: handleMinMaxChange(minMaxEnabled);
  function handleMinMaxChange(value) {
    sendData(epmo, epv0, epmi, epma, epse);
    syncWithGrid();
  }

  $: handleSensitivityChange(sensitivityEnabled);
  function handleSensitivityChange(value) {
    sendData(epmo, epv0, epmi, epma, epse);
    syncWithGrid();
  }

  function syncWithGrid() {
    // TODO: remove sendData from here and fix $: reactivity properly
    sendData(epmo, epv0, epmi, epma, epse);
    dispatch("sync");
  }

  function sendData(p1, p2, p3, p4, p5) {
    const optional = [];

    if (minMaxEnabled) {
      optional.push(`self:epmi(${p3}) self:epma(${p4})`);
    }

    if (sensitivityEnabled) {
      optional.push(`self:epse(${p5})`);
    }

    dispatch("update-action", {
      short: `sen`,
      script:
        `self:epmo(${p1}) self:epv0(${p2})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
      validationError: validators.some((e) => e.value === false),
    });
  }

  const suggestions = [
    [
      { value: "0", info: "Absolute" },
      { value: "1", info: "Relative" },
    ],

    [
      { value: "0", info: "No velocity (0%)" },
      { value: "50", info: "Default (50%)" },
      { value: "100", info: "Maximum (100%)" },
    ],
  ];

  let minMaxEnabled = false;
  let sensitivityEnabled = false;
</script>

<endless-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <Block>
    <MeltCombo
      title={"Endless Mode"}
      value={epmo}
      suggestions={suggestions[0]}
      validator={validators[0].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        epmo = value;
        validators[0].value = !validationError;
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Endless Velocity"}
      value={epv0}
      suggestions={suggestions[1]}
      validator={validators[1].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        epv0 = value;
        validators[1].value = !validationError;
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />
    <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
      <MeltCombo
        title={"Min"}
        disabled={!minMaxEnabled}
        value={epmi}
        validator={validators[2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          epmi = value;
          validators[2].value = !validationError;
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        disabled={!minMaxEnabled}
        value={epma}
        validator={validators[3].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          epma = value;
          validators[3].value = !validationError;
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </div>

    <MeltCheckbox bind:target={sensitivityEnabled} title="Enable Sensitivity" />

    <MeltCombo
      title={"Sensitivity"}
      disabled={!sensitivityEnabled}
      value={epse}
      validator={validators[4].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        epse = value;
        validators[4].value = !validationError;
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
</endless-settings>
