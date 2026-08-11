<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { grid } from "@intechstudio/grid-protocol";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "sbc",
    name: "SettingsButton",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/element-settings/button-mode",
    category: "element settings",
    displayName: "Button Mode",
    description: "Configure how the button responds",
    color: categoryColors["element settings"],
    defaultLua: "self:bmo(0) self:bmi(0) self:bma(127)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.8"/></svg>`,
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
  import { ElementType, GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
  import {
    Block,
    BlockRow,
    MeltCombo,
    type MeltComboSuggestion,
  } from "@intechstudio/grid-uikit";
  import {
    ActionData,
    GridAction,
    GridElement,
    GridEvent,
    GridModule,
    GridPage,
  } from "../runtime/runtime.js";
  import { Grid } from "../lib/_utils.js";
  import { SettingsButton } from "./SettingsButton.js";
  import { extractParam } from "./_script_parsers.js";

  export let action: GridAction;
  let event = action.parent as GridEvent;
  let element = event.parent as GridElement;
  let page = element.parent as GridPage;
  let module = page.parent as GridModule;

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

  let bmo = "";
  let bmi = "0";
  let bma = "127";

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    bmo = extractParam(data.script, "bmo");

    const newBmi = extractParam(data.script, "bmi");
    const newBma = extractParam(data.script, "bma");
    if (!!newBmi || !!newBma) {
      bmi = newBmi;
      bma = newBma;
    }
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function sendData() {
    validators[0].value = validators[0].func(bmo);
    validators[1].value = validators[1].func(bmi);
    validators[2].value = validators[2].func(bma);
    const optional = [];
    optional.push(`self:bmi(${bmi}) self:bma(${bma})`);

    dispatch("update-action", {
      short: `sbc`,
      script:
        `self:bmo(${bmo})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
      validationError: validators.some((e) => e.value === false),
    });
  }

  const suggestions: Array<MeltComboSuggestion[]> = [
    [
      ...Grid.Array.when<MeltComboSuggestion>(
        [
          grid.getProperty("HWCFG").TEK2_RevH,
          grid.getProperty("HWCFG").VSN1L_RevH,
          grid.getProperty("HWCFG").VSN1R_RevH,
          grid.getProperty("HWCFG").VSN2_RevH,
          grid.getProperty("HWCFG").BU16_RevH,
          grid.getProperty("HWCFG").PBF4_RevH,
          grid.getProperty("HWCFG").OCTV_RevH,
        ].includes(module.hwcfg) && element.type === ElementType.BUTTON,
        [
          { value: "-2", info: "Pressure" },
          { value: "-1", info: "Velocity" },
        ],
      ),
      { value: "0", info: "Momentary" },
      { value: "1", info: "Toggle" },
      { value: "2", info: "3-step" },
      { value: "3", info: "4-step" },
    ],
    [
      { value: "127", info: "7 bit MIDI (default)" },
      { value: "16383", info: "14 bit MIDI (high res)" },
    ],
  ];

  let stepValues: number[];
  $: stepValues = SettingsButton.calculateStepValuesFirmwareStyle(
    Number(bmo) + 1,
    Number(bmi),
    Number(bma),
  );
</script>

<encoder-settings class="flex flex-col w-full px-4 py-2 pointer-events-auto">
  <Block>
    <MeltCombo
      title={"Button Mode"}
      value={bmo}
      suggestions={suggestions[0]}
      validator={validators[0].func}
      on:input={(e) => {
        const { value, validationError } = e.detail;
        bmo = value;
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
        value={bmi}
        validator={validators[1].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          bmi = value;
          validators[1].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />

      <MeltCombo
        title={"Max"}
        value={bma}
        validator={validators[2].func}
        suggestions={suggestions[1]}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          bma = value;
          validators[2].value = !validationError;
          sendData();
        }}
        on:change={syncWithGrid}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </BlockRow>
  </Block>

  <div class="flex flex-row gap-2" class:invisible={Number(bmo) === 0}>
    <span class="text-gray-500 text-sm">Step values:</span>
    <div class="text-white text-sm">
      {#each stepValues as step, i}
        <span>{step}</span>
        <span class:hidden={i === stepValues.length - 1} class="mr-2">,</span>
      {/each}
    </div>
  </div>
</encoder-settings>
