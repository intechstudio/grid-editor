<script lang="ts" context="module">
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
    defaultLua: "self:bmo(0)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
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
  import MoltenEnabled from "../main/user-interface/MoltenEnabled.svelte";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let bmo = ""; // local script part

  const whatsInParenthesis = /\(([^)]+)\)/;

  let bmi = "0";
  let bma = "255";

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : null;
    };

    bmo = extractParam(0);

    const param2 = extractParam(2);
    const param3 = extractParam(3);

    minMaxEnabled = !!param2 || !!param3;
    if (minMaxEnabled) {
      bmi = param2;
      bma = param3;
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: sendData(
    bmo,
    minMaxEnabled ? bmi : undefined,
    minMaxEnabled ? bma : undefined
  );

  function sendData(p1, p2, p3) {
    const optional = [minMaxEnabled ? `self:bmi(${p2}) self:bma(${p3})` : ""];
    dispatch("output", {
      short: `sbc`,
      script: `self:bmo(${p1}) ${optional.join(" ")}`,
    });
  }

  const suggestions = [
    [
      { value: "0", info: "Momentary" },
      { value: "1", info: "Toggle" },
      { value: "2", info: "2-step" },
      { value: "3", info: "3-step" },
    ],
  ];

  let suggestionElement = undefined;
  let minMaxEnabled = false;
</script>

<encoder-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="text-gray-500 text-sm pb-1">Button Mode</div>
  <AtomicInput
    inputValue={bmo}
    suggestions={suggestions[0]}
    suggestionTarget={suggestionElement}
    on:change={(e) => {
      bmo = e.detail;
    }}
    validator={() => {
      return new Validator().NotEmpty().Result();
    }}
    on:validator={(e) => {
      const data = e.detail;
      dispatch("validator", data);
    }}
  />

  <div class="flex flex-row gap-2">
    <span class="text-gray-500 text-sm">Step values:</span>
    <div class="text-white text-sm">
      {#if Number(bmo) > 1}
        {@const stepValues = Array.from(
          { length: Number(bmo) },
          (_, index) =>
            (index + 1) *
            Math.floor(
              (minMaxEnabled ? Number(bma) - Number(bmi) : 255) / Number(bmo) +
                Number(bmi)
            )
        )}
        {#each stepValues as step, i}
          <span>{step}</span>
          <span class:hidden={i === stepValues.length - 1} class="mr-2">,</span>
        {/each}
      {:else}
        <span>N/A</span>
      {/if}
    </div>
  </div>

  <div class="w-full flex flex-col gap-2">
    <div class="w-full flex-row flex justify-between items-center">
      <div class="text-gray-500 text-sm truncate">Optional: Min/Max Value</div>
      <MoltenEnabled
        bind:value={minMaxEnabled}
        style={{ color: "rgba(115, 115, 115, 1)", fontSize: 11 }}
      />
    </div>
    <div class="flex flex-row gap-2">
      <AtomicInput
        inputValue={bmi}
        disabled={!minMaxEnabled}
        validator={() => {
          return minMaxEnabled
            ? new Validator().NotEmpty().Result()
            : new Validator().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          bmi = e.detail;
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
      <AtomicInput
        inputValue={bma}
        disabled={!minMaxEnabled}
        validator={() => {
          return minMaxEnabled
            ? new Validator().NotEmpty().Result()
            : new Validator().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          bma = e.detail;
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>
  </div>

  <AtomicSuggestions bind:component={suggestionElement} />
</encoder-settings>
