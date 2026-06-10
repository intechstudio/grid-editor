<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.js";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "sen",
    name: "SettingsEndless",
    rendering: "standard",
    category: "element settings",
    color: "#5F416D",
    displayName: "Endless Mode",
    defaultLua:
      "self:epmo(0) self:epv0(50) self:epmi(0) self:epma(16383) self:epse(50)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">EP</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">EP</span>`,
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

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    epmo = extractParam(data.script, "epmo");
    epv0 = extractParam(data.script, "epv0");

    const newEpmi = extractParam(data.script, "epmi");
    const newEpma = extractParam(data.script, "epma");
    if (!!newEpmi || !!newEpma) {
      epmi = newEpmi;
      epma = newEpma;
    }

    const newEpse = extractParam(data.script, "epse");
    if (!!newEpse) {
      epse = newEpse;
    }
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function sendData() {
    validators[0].value = validators[0].func(epmo);
    validators[1].value = validators[1].func(epv0);
    validators[2].value = validators[2].func(epmi);
    validators[3].value = validators[3].func(epma);
    validators[4].value = validators[4].func(epse);
    const optional = [];

    optional.push(`self:epmi(${epmi}) self:epma(${epma})`);

    optional.push(`self:epse(${epse})`);

    dispatch("update-action", {
      short: `sen`,
      script:
        `self:epmo(${epmo}) self:epv0(${epv0})` +
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
</script>

<endless-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <Block
    ><BlockRow>
      <MeltCombo
        title={"Endless Mode"}
        value={epmo}
        suggestions={suggestions[0]}
        validator={validators[0].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          epmo = value;
          validators[0].value = !validationError;
          sendData();
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
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </BlockRow>
    <BlockRow>
      <MeltCombo
        title={"Min"}
        value={epmi}
        validator={validators[2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          epmi = value;
          validators[2].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        value={epma}
        validator={validators[3].func}
        suggestions={suggestions[2]}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          epma = value;
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
      value={epse}
      validator={validators[4].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        epse = value;
        validators[4].value = !validationError;
        sendData();
      }}
      on:change={syncWithGrid}
      postProcessor={GridScript.shortify}
      preProcessor={GridScript.humanize}
    />
  </Block>
</endless-settings>
