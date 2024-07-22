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
  import { configManager } from "../main/panels/configuration/Configuration.store";
  import { Validator } from "./_validators";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let scriptValue = ""; // local script part

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    let param1 = whatsInParenthesis.exec(config.script);

    if (param1 !== null) {
      if (param1.length > 0) {
        scriptValue = param1[1];
      }
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: if (scriptValue) {
    sendData(scriptValue);
  }

  function sendData(value) {
    dispatch("output", { short: `sbc`, script: `self:bmo(${value})` });
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
</script>

<encoder-settings
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
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
</encoder-settings>
