<script lang="ts" context="module">
  import MoltenEnabled from "./../main/user-interface/MoltenEnabled.svelte";
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
    defaultLua: "self:pmo(7) self:pma(127)",
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
  import { configManager } from "../main/panels/configuration/Configuration.store";
  import { Validator } from "./_validators";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let pmo = ""; // local script part
  let pma = "";

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
    pma = extractParam(1);

    const param3 = extractParam(2);

    minEnabled = !!param3;
    if (minEnabled) {
      pmi = param3;
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: sendData(pmo, pma, minEnabled ? pmi : undefined);

  function sendData(p1, p2, p3) {
    const optional = [minEnabled ? `self:pmi(${p3})` : ""];
    dispatch("output", {
      short: "spc",
      script: `self:pmo(${p1}) self:pma(${p2}) ${optional.join(" ")}`,
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

  let suggestionElement = undefined;
  let minEnabled = false;
</script>

<potmeter-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="w-full flex flex-row gap-2">
    <div class="flex flex-col">
      <div class="text-gray-500 text-sm pb-1">Bit depth</div>
      <AtomicInput
        inputValue={pmo}
        suggestions={suggestions[0]}
        validator={() => {
          return new Validator().NotEmpty().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          pmo = e.detail;
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>

    <div class="flex flex-col">
      <div class="text-gray-500 text-sm pb-1">Max Value</div>
      <AtomicInput
        inputValue={pma}
        suggestions={suggestions[1]}
        validator={() => {
          return new Validator().NotEmpty().Result();
        }}
        suggestionTarget={suggestionElement}
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

  <div class="flex flex-row gap-2">
    <span class="text-gray-500 text-sm">Step size:</span>
    <span class="text-white text-sm"
      >{Math.floor(
        (Number(pma) - (minEnabled ? Number(pmi) : 0)) / Number(pmo)
      )}</span
    >
  </div>

  <div class="w-full flex flex-col gap-2">
    <div class="w-full flex-row flex justify-between items-center">
      <div class="text-gray-500 text-sm truncate">Optional: Min Value</div>
      <MoltenEnabled
        bind:value={minEnabled}
        style={{ color: "rgba(115, 115, 115, 1)", fontSize: 11 }}
      />
    </div>

    <AtomicInput
      inputValue={pmi}
      disabled={!minEnabled}
      validator={() => {
        return minEnabled
          ? new Validator().NotEmpty().Result()
          : new Validator().Result();
      }}
      suggestionTarget={suggestionElement}
      on:change={(e) => {
        pmi = e.detail;
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
    />
  </div>

  <AtomicSuggestions bind:component={suggestionElement} />
</potmeter-settings>
