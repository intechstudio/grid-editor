<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "ggbs",
    name: "GamePadButton",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/gamepad/gamepad-button/",
    category: "hid",
    displayName: "GamePad Button",
    description: "Press a virtual gamepad button",
    defaultLua: "ggbs(0,0)",
    color: categoryColors["hid"] as any,

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M6.8 8h10.4a4.8 4.8 0 0 1 4.7 5.7l-.5 2.6a2.6 2.6 0 0 1-4.5 1.2L15 15.5H9l-1.9 2a2.6 2.6 0 0 1-4.5-1.2l-.5-2.6A4.8 4.8 0 0 1 6.8 8Z"/><path d="M8 10.8v2.4M6.8 12h2.4"/><circle cx="15.4" cy="11.2" r="0.95" fill="currentColor" stroke="none"/><circle cx="17.6" cy="12.8" r="0.95" fill="currentColor" stroke="none"/></svg>`,
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
  import { createEventDispatcher, onMount } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Script } from "./_script_parsers.js";
  import { Validator } from "./validators";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";

  export let action: GridAction;

  let event = action.parent as GridEvent;

  const dispatch = createEventDispatcher();

  const parameterNames = ["Button", "State"];
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
  ];

  let scriptSegments = [];

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    scriptSegments = Script.toSegments({
      short: data.short,
      script: data.script,
    });
  }

  function sendData(value, index) {
    scriptSegments[index] = value;
    validators.forEach((v, i) => {
      v.value = v.func(scriptSegments[i] ?? "");
    });
    const script = Script.toScript({
      short: action.short,
      array: scriptSegments,
    });
    dispatch("update-action", {
      short: action.short,
      script: script,
      validationError: validators.some((e) => e.value === false),
    });
  }

  let suggestions = [];

  const _suggestions = [
    [
      { value: "0", info: "Button 0" },
      { value: "1", info: "Button 1" },
      { value: "2", info: "Button 2" },
      { value: "3", info: "Button 3" },
      { value: "4", info: "Button 4" },
      { value: "5", info: "Button 5" },
      { value: "6", info: "Button 6" },
      { value: "7", info: "Button 7" },
      { value: "8", info: "Button 8" },
      { value: "9", info: "Button 9" },
      { value: "10", info: "Button 10" },
      { value: "11", info: "Button 11" },
      { value: "12", info: "Button 12" },
      { value: "13", info: "Button 13" },
      { value: "14", info: "Button 14" },
      { value: "15", info: "Button 15" },
      { value: "16", info: "Button 16" },
      { value: "17", info: "Button 17" },
      { value: "18", info: "Button 18" },
      { value: "19", info: "Button 19" },
      { value: "20", info: "Button 20" },
      { value: "21", info: "Button 21" },
      { value: "22", info: "Button 22" },
      { value: "23", info: "Button 23" },
      { value: "24", info: "Button 24" },
      { value: "25", info: "Button 25" },
      { value: "26", info: "Button 26" },
      { value: "27", info: "Button 27" },
      { value: "28", info: "Button 28" },
      { value: "29", info: "Button 29" },
      { value: "30", info: "Button 30" },
      { value: "31", info: "Button 31" },
    ],
    [
      { value: "1", info: "Press" },
      { value: "0", info: "Release" },
    ],
  ];

  $: {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = _suggestions.map((s, i) => {
      return [...localDefinitions, ...s];
    });
  }

  onMount(() => {
    suggestions = _suggestions;
  });
</script>

<div class="flex flex-col w-full p-2 pointer-events-auto">
  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    {#each scriptSegments as script, i}
      <MeltCombo
        title={parameterNames[i]}
        value={script}
        suggestions={suggestions[i]}
        validator={validators[i].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          script = value;
          validators[i].value = !validationError;
          sendData(value, i);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    {/each}
  </div>
</div>
