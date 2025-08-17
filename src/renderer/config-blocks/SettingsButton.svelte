<script lang="ts" module>
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
    defaultLua: "self:bmo(0) self:bmi(0) self:bma(127)",
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
  import { run } from 'svelte/legacy';

  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
  import {
    MeltCheckbox,
    Block,
    BlockBody,
    BlockRow,
    MeltCombo,
    MeltComboSuggestion,
  } from "@intechstudio/grid-uikit";
  import {
    GridAction,
    GridElement,
    GridEvent,
    GridModule,
    GridPage,
  } from "../runtime/runtime.js";
  import { Grid } from "../lib/_utils.js";
  import { SettingsButton } from "./SettingsButton.js";

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();
  let event = config.parent as GridEvent;
  let element = event.parent as GridElement;
  let page = element.parent as GridPage;
  let module = page.parent as GridModule;

  const dispatch = createEventDispatcher();

  const validators = $state([
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
  ]);

  const whatsInParenthesis = /\(([^)]+)\)/;
  let bmo = $state("");
  let bmi = $state("0");
  let bma = $state("127");


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

    if (!!parts.bmi || !!parts.bma) {
      bmi = parts.bmi;
      bma = parts.bma;
    }
  }

  function syncWithGrid() {
    dispatch("sync");
  }

  function sendData() {
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
        [27, 91, 59, 123, 131, 67, 75].includes(module.hwcfg),
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

  let stepValues: number[] = $derived(SettingsButton.calculateStepValuesFirmwareStyle(
    Number(bmo) + 1,
    Number(bmi),
    Number(bma),
  ));
  run(() => {
    if (!$config.invalid) {
      handleConfigChange($config);
    }
  });
  
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
