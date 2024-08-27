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
  import { AtomicInput } from "@intechstudio/grid-uikit";
  import { AtomicSuggestions } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./_validators.js";
  import { MeltCheckbox } from "@intechstudio/grid-uikit";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let epmo = ""; // local script part
  let epv0 = "";

  let epmi = "0";
  let epma = "16383";
  let epse = "50";

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : null;
    };

    epmo = extractParam(0);
    epv0 = extractParam(1);

    const param3 = extractParam(2);
    const param4 = extractParam(3);

    minMaxEnabled = !!param3 || !!param4;
    if (minMaxEnabled) {
      epmi = param3;
      epma = param4;
    }

    const param5 = extractParam(4);
    sensitivityEnabled = !!param5;
    if (sensitivityEnabled) {
      epse = param5;
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: sendData(
    epmo,
    epv0,
    minMaxEnabled ? epmi : undefined,
    minMaxEnabled ? epma : undefined,
    sensitivityEnabled ? epse : undefined
  );

  function sendData(p1, p2, p3, p4, p5) {
    const optional = [];

    if (minMaxEnabled) {
      optional.push(`self:epmi(${p3}) self:epma(${p4})`);
    }

    if (sensitivityEnabled) {
      optional.push(`self:epse(${p5})`);
    }

    dispatch("output", {
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

  let suggestionElement = undefined;

  let minMaxEnabled = false;
  let sensitivityEnabled = false;
</script>

<endless-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="flex flex-row gap-2">
    <div class="flex flex-col">
      <div class="text-gray-500 text-sm pb-1 truncate">Endless Mode</div>
      <AtomicInput
        inputValue={GridScript.humanize(epmo)}
        suggestions={suggestions[0]}
        validator={(e) => {
          return new Validator(e).NotEmpty().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          epmo = GridScript.shortify(e.detail);
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>

    <div class="flex flex-col">
      <div class="text-gray-500 text-sm pb-1 truncate">Endless Velocity</div>
      <AtomicInput
        inputValue={GridScript.humanize(epv0)}
        suggestions={suggestions[1]}
        validator={(e) => {
          return new Validator(e).NotEmpty().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          epv0 = GridScript.shortify(e.detail);
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
        disabled={minMaxEnabled}
        inputValue={GridScript.humanize(epmi)}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:change={(e) => {
          epmi = GridScript.shortify(e.detail);
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
        inputValue={GridScript.humanize(epma)}
        validator={(e) => {
          return minMaxEnabled
            ? new Validator(e).NotEmpty().Result()
            : new Validator(e).Result();
        }}
        on:change={(e) => {
          epma = GridScript.shortify(e.detail);
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>
  </div>

  <MeltCheckbox bind:target={sensitivityEnabled} title="Enable Sensitivity" />

  <div class="flex flex-col">
    <span class="text-sm text-gray-500">Sensitivity</span>
    <AtomicInput
      disabled={!sensitivityEnabled}
      inputValue={GridScript.humanize(epse)}
      validator={(e) => {
        return minMaxEnabled
          ? new Validator(e).NotEmpty().Result()
          : new Validator(e).Result();
      }}
      on:change={(e) => {
        epse = GridScript.shortify(e.detail);
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
    />
  </div>
</endless-settings>
