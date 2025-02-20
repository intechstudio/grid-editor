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

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./_validators.js";
  import {
    MeltCheckbox,
    Block,
    BlockBody,
    MeltCombo,
  } from "@intechstudio/grid-uikit";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let epmo = ""; // local script part
  let epv0 = "";

  let epmi = "0";
  let epma = "16383";
  let epse = "50";

  const whatsInParenthesis = /\(([^)]+)\)/;

  $: handleConfigChange($config);

  function handleConfigChange(config) {
    if (!config.checkSyntax()) {
      return;
    }

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

<endless-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <Block>
    <MeltCombo
      title={"Endless Mode"}
      bind:value={epmo}
      suggestions={suggestions[0]}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />

    <MeltCombo
      title={"Endless Velocity"}
      bind:value={epv0}
      suggestions={suggestions[1]}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
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
        bind:value={epmi}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        disabled={!minMaxEnabled}
        bind:value={epma}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
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
      bind:value={epse}
      validator={(e) => {
        return minMaxEnabled
          ? new Validator(e).NotEmpty().Result()
          : new Validator(e).Result();
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
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
