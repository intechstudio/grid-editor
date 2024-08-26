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

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { MeltCheckbox } from "@intechstudio/grid-uikit";
  import { AtomicInput } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { AtomicSuggestions } from "@intechstudio/grid-uikit";
  import { Validator } from "./_validators";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let emo = ""; // local script part
  let ev0 = "";

  let emi = "0";
  let ema = "127";
  let ese = "100";

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : null;
    };

    emo = extractParam(0);
    ev0 = extractParam(1);

    const param3 = extractParam(2);
    const param4 = extractParam(3);

    minMaxEnabled = !!param3 || !!param4;
    if (minMaxEnabled) {
      emi = param3;
      ema = param4;
    }

    const param5 = extractParam(4);
    sensitivityEnabled = !!param5;
    if (sensitivityEnabled) {
      ese = param5;
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: sendData(
    emo,
    ev0,
    minMaxEnabled ? emi : undefined,
    minMaxEnabled ? ema : undefined,
    sensitivityEnabled ? ese : undefined
  );

  function sendData(p1, p2, p3, p4, p5) {
    const optional = [];

    if (minMaxEnabled) {
      optional.push(`self:emi(${p3}) self:ema(${p4})`);
    }

    if (sensitivityEnabled) {
      optional.push(`self:ese(${p5})`);
    }

    dispatch("output", {
      short: `sec`,
      script:
        `self:emo(${p1}) self:ev0(${p2})` +
        (optional.length > 0 ? " " + optional.join(" ") : ""),
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
  ];

  let suggestionElement = undefined;

  let minMaxEnabled = false;
  let sensitivityEnabled = false;
</script>

<encoder-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="w-full flex flex-row gap-2">
    <div class="flex flex-col">
      <div class="text-gray-500 text-sm pb-1 truncate">Encoder Mode</div>
      <AtomicInput
        inputValue={GridScript.humanize(emo)}
        suggestions={suggestions[0]}
        validator={(e) => {
          return new Validator(e).NotEmpty().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          emo = GridScript.shortify(e.detail);
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>

    <div class="flex flex-col">
      <div class="text-gray-500 text-sm pb-1 truncate">Encoder Velocity</div>
      <AtomicInput
        inputValue={GridScript.humanize(ev0)}
        suggestions={suggestions[1]}
        validator={(e) => {
          return new Validator(e).NotEmpty().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          ev0 = GridScript.shortify(e.detail);
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>
  </div>

  <AtomicSuggestions bind:component={suggestionElement} />

  <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />

  <div class="flex flex-row gap-2">
    <div class="flex flex-col">
      <span class="text-sm text-gray-500">Min</span>
      <AtomicInput
        disabled={!minMaxEnabled}
        inputValue={GridScript.humanize(emi)}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:change={(e) => {
          emi = GridScript.shortify(e.detail);
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
        disabled={!minMaxEnabled}
        inputValue={GridScript.humanize(ema)}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:change={(e) => {
          ema = GridScript.shortify(e.detail);
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>
  </div>

  <MeltCheckbox bind:target={sensitivityEnabled} title={"Enable Sensitivity"} />

  <div class="flex flex-col">
    <span class="text-sm text-gray-500">Sensitivity</span>
    <AtomicInput
      disabled={!sensitivityEnabled}
      inputValue={GridScript.humanize(ese)}
      validator={(e) => {
        return minMaxEnabled
          ? new Validator(e).NotEmpty().Result()
          : new Validator(e).Result();
      }}
      on:change={(e) => {
        ese = GridScript.shortify(e.detail);
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
    />
  </div>
</encoder-settings>
