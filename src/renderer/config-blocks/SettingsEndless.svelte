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
    defaultLua: "self:enmo(0) self:env0(50)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">EN</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">EN</span>`,
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
  import { Validator } from "./_validators.js";
  import { MeltCheckbox } from "@intechstudio/grid-uikit";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let enmo = ""; // local script part
  let env0 = "";

  let enmi = "0";
  let enma = "127";
  let ense = "100";

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    const extractParam = (index) => {
      const param = whatsInParenthesis.exec(arr[index]);
      return param && param.length > 0 ? param[1] : null;
    };

    enmo = extractParam(0);
    env0 = extractParam(1);

    const param3 = extractParam(2);
    const param4 = extractParam(3);

    minMaxEnabled = !!param3 || !!param4;
    if (minMaxEnabled) {
      enmi = param3;
      enma = param4;
    }

    const param5 = extractParam(4);
    sensitivityEnabled = !!param5;
    if (sensitivityEnabled) {
      ense = param5;
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: sendData(
    enmo,
    env0,
    minMaxEnabled ? enmi : undefined,
    minMaxEnabled ? enma : undefined,
    sensitivityEnabled ? ense : undefined
  );

  function sendData(p1, p2, p3, p4, p5) {
    const optional = [
      minMaxEnabled ? `self:enmi(${p3}) self:enma(${p4})` : "",
      sensitivityEnabled ? `self:ense(${p5})` : "",
    ];
    dispatch("output", {
      short: `sec`,
      script: `self:enmo(${p1}) self:env0(${p2}) ${optional.join(" ")}`,
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

<encoder-settings
  class="{$$props.class} flex flex-col w-full px-4 py-2 pointer-events-auto"
>
  <div class="w-full flex flex-row gap-2">
    <div class="flex flex-col">
      <div class="text-gray-500 text-sm pb-1 truncate">Encoder Mode</div>
      <AtomicInput
        inputValue={enmo}
        suggestions={suggestions[0]}
        validator={() => {
          return new Validator().NotEmpty().Result();
        }}
        suggestionTarget={suggestionElement}
        on:change={(e) => {
          enmo = e.detail;
        }}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
      />
    </div>

    <div class="w-full flex flex-row gap-2">
      <div class="flex flex-col">
        <div class="text-gray-500 text-sm pb-1 truncate">Encoder Velocity</div>
        <AtomicInput
          inputValue={env0}
          suggestions={suggestions[1]}
          validator={() => {
            return new Validator().NotEmpty().Result();
          }}
          suggestionTarget={suggestionElement}
          on:change={(e) => {
            env0 = e.detail;
          }}
          on:validator={(e) => {
            const data = e.detail;
            dispatch("validator", data);
          }}
        />
      </div>
    </div>
  </div>

  <AtomicSuggestions bind:component={suggestionElement} />

  <MeltCheckbox bind:target={minMaxEnabled} title={"Enable Min/Max Value"} />
  <div class="flex flex-row gap-2">
    <div class="flex flex-col">
      <span class="text-sm text-gray-500">Min</span>
      <AtomicInput
        inputValue={enmi}
        disabled={!minMaxEnabled}
        validator={() => {
          return minMaxEnabled
            ? new Validator().NotEmpty().Result()
            : new Validator().Result();
        }}
        on:change={(e) => {
          enmi = e.detail;
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
        inputValue={enma}
        disabled={!minMaxEnabled}
        validator={() => {
          return minMaxEnabled
            ? new Validator().NotEmpty().Result()
            : new Validator().Result();
        }}
        on:change={(e) => {
          enma = e.detail;
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
      inputValue={ense}
      disabled={!sensitivityEnabled}
      validator={() => {
        return minMaxEnabled
          ? new Validator().NotEmpty().Result()
          : new Validator().Result();
      }}
      on:change={(e) => {
        ense = e.detail;
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
    />
  </div>
</encoder-settings>
