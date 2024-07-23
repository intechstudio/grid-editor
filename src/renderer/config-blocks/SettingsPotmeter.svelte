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

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";
  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";
  import { Validator } from "./_validators";
  import { MeltCheckbox } from "@intechstudio/grid-uikit";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let pmo = ""; // local script part

  let pma = "127";
  let pmi = "0";

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : null;
    };

    pmo = extractParam(0);

    const param2 = extractParam(1);
    const param3 = extractParam(2);

    minMaxEnabled = !!param2 || !!param3;
    if (minMaxEnabled) {
      pmi = param2;
      pma = param3;
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: sendData(pmo, pma, minMaxEnabled ? pmi : undefined);

  function sendData(p1, p2, p3) {
    const optional = [minMaxEnabled ? `self:pmi(${p3})  self:pma(${p2})` : ""];
    dispatch("output", {
      short: "spc",
      script: `self:pmo(${p1}) ${optional.join(" ")}`,
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

  let bitDepthSuggestionElement = undefined;
  let minMaxSuggestionElement = undefined;
  let minMaxEnabled = false;

  function calculateStepSize(bit, min, max) {
    return Math.floor((max - min + 1) / Math.pow(2, bit));
  }

  let stepSize;
  $: stepSize = calculateStepSize(
    Number(pmo),
    minMaxEnabled ? Number(pmi) : 0,
    minMaxEnabled ? Number(pma) : 127
  );
</script>

<potmeter-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="flex flex-col">
    <div class="text-gray-500 text-sm pb-1">Bit depth</div>
    <AtomicInput
      inputValue={pmo}
      suggestions={suggestions[0]}
      validator={() => {
        return new Validator().NotEmpty().Result();
      }}
      suggestionTarget={bitDepthSuggestionElement}
      on:change={(e) => {
        pmo = e.detail;
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
    />
  </div>

  <AtomicSuggestions bind:component={bitDepthSuggestionElement} />

  <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />

  <div class="flex flex-row gap-2">
    <div class="flex flex-col">
      <span class="text-sm text-gray-500">Min</span>
      <AtomicInput
        inputValue={pmi}
        disabled={!minMaxEnabled}
        validator={() => {
          return minMaxEnabled
            ? new Validator().NotEmpty().Result()
            : new Validator().Result();
        }}
        on:change={(e) => {
          pmi = e.detail;
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>
    <div class="flex flex-col">
      <span class="text-sm text-gray-500">Max</span>
      <AtomicInput
        inputValue={pma}
        suggestions={suggestions[1]}
        disabled={!minMaxEnabled}
        validator={() => {
          return new Validator().NotEmpty().Result();
        }}
        suggestionTarget={minMaxSuggestionElement}
        on:change={(e) => {
          pma = e.detail;
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>
  </div>

  {#if minMaxEnabled}
    <div class="flex flex-row gap-2">
      <span class="text-gray-500 text-sm">Step size:</span>
      <span class="text-white text-sm">{stepSize}</span>
    </div>

    <AtomicSuggestions bind:component={minMaxSuggestionElement} />
  {/if}
</potmeter-settings>
