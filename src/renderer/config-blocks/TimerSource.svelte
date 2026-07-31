<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "gts",
    name: "TimerSource",
    category: "timer",
    rendering: "standard",
    documentationUrl: "https://docs.intech.studio/category/timer-actions",
    displayName: "Clock Source",
    description: "Run actions when the timer fires",
    color: categoryColors["timer"] as any,
    defaultLua: "gts(self:ind(),0)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="13" r="8"/><path d="M12 9.5V13l2.6 1.6"/><path d="M4.6 4.4 2.8 6.2M19.4 4.4l1.8 1.8"/></svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
    hiddenInMinimalist: true,
    editName: true,
    version: "2.0",
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Script } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { Validator } from "./validators";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  const parameterNames = ["Element Number", "Source"];
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
  let event = action.parent as GridEvent;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    scriptSegments = Script.toSegments({
      short: data.short,
      script: data.script,
    });
  }

  function sendData(e, index) {
    scriptSegments[index] = e;
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

  let _suggestions = [
    [],
    [
      { value: "0", info: "Milliseconds (Default)" },
      { value: "1", info: "MIDI beat clock" },
    ],
  ];

  let suggestions;

  $: {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = _suggestions.map((s, i) => {
      // SKIP LAYER
      return [...s, ...localDefinitions];
    });
  }
</script>

<timer-start class="flex flex-col w-full p-2 pointer-events-auto">
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
</timer-start>
