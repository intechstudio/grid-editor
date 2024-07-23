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
  import { AtomicInput } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { AtomicSuggestions } from "@intechstudio/grid-uikit";
  import { Validator } from "./_validators";
  import { MeltCheckbox } from "@intechstudio/grid-uikit";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let bmo = ""; // local script part

  const whatsInParenthesis = /\(([^)]+)\)/;

  let bmi = "0";
  let bma = "127";

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : null;
    };

    bmo = extractParam(0);

    const param2 = extractParam(1);
    const param3 = extractParam(2);

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
      { value: "2", info: "3-step" },
      { value: "3", info: "4-step" },
    ],
  ];

  let suggestionElement = undefined;
  let minMaxEnabled = false;

  function calculateStepValues(steps, min, max) {
    const stepValue = Math.floor(Math.abs(min - max) / (steps - 1));
    const res = Array.from(
      { length: steps },
      (_, index) => min + index * stepValue
    );
    return res;
  }

  let stepValues;
  $: stepValues = calculateStepValues(
    Number(bmo) + 1,
    minMaxEnabled ? Number(bmi) : 0,
    minMaxEnabled ? Number(bma) : 127
  );
</script>

<encoder-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Button Mode</div>
    <AtomicInput
      inputValue={GridScript.humanize(scriptValue)}
      suggestions={suggestions[0]}
      suggestionTarget={suggestionElement}
      on:change={(e) => {
        scriptValue = GridScript.shortify(e.detail);
      }}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
    />
  </div>

  <AtomicSuggestions bind:component={suggestionElement} />

  <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />
  <div class="flex flex-row gap-2">
    <div class="flex flex-col">
      <span class="text-sm text-gray-500">Min</span>
      <AtomicInput
        inputValue={GridScript.humanize(bmi)}
        disabled={!minMaxEnabled}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          bmi = GridScript.shortify(e.detail);
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
        inputValue={GridScript.humanize(bma)}
        disabled={!minMaxEnabled}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          bma = GridScript.shortify(e.detail);
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>
  </div>

  {#if minMaxEnabled && Number(bmo) > 0}
    <div class="flex flex-row gap-2">
      <span class="text-gray-500 text-sm">Step values:</span>
      <div class="text-white text-sm">
        {#each stepValues as step, i}
          <span>{step}</span>
          <span class:hidden={i === stepValues.length - 1} class="mr-2">,</span>
        {/each}
      </div>
    </div>
  {/if}
</encoder-settings>
