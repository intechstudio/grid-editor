<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "glat",
    name: "LedAnimationStart",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/led/led-start-animation",
    category: "led",
    displayName: "Start Animation",
    description: "Start an LED animation",
    color: categoryColors["led"],
    defaultLua: "glpfs(num,1,val,1,1)",

    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="M10 8.7v6.6l5.4-3.3z"/></svg>`,
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
  import { createEventDispatcher } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";

  import { Script } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";

  import { Validator } from "./validators";
  import {
    ActionData,
    GridAction,
    GridElement,
    GridEvent,
  } from "./../runtime/runtime";
  import { Grid } from "../lib/_utils.js";

  export let action: GridAction;

  let event = action.parent as GridEvent;
  const dispatch = createEventDispatcher();

  const parameterNames = ["LED Number", "Layer", "Phase", "Rate", "Shape"];
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
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
  ];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    scriptSegments = Script.toSegments({
      short: "glpfs",
      script: data.script,
    });
  }

  function sendData(e, index) {
    scriptSegments[index] = e;
    validators.forEach((v, i) => {
      v.value = v.func(scriptSegments[i] ?? "");
    });
    const script = Script.toScript({
      short: "glpfs",
      array: scriptSegments,
    });
    dispatch("update-action", {
      short: action.short,
      script: script,
      validationError: validators.some((e) => e.value === false),
    });
  }

  const _suggestions = [
    // led number
    [
      //{value: 'this.ind()', info: 'this led'},
    ],
    // layer
    [
      { value: "1", info: "layer 1" },
      { value: "2", info: "layer 2" },
    ],
    // phase
    [
      //{value: 'to do...', info: 'to do...'}
    ],
    // frequency
    [
      { value: "1", info: "1 (slow)" },
      { value: "2", info: "2" },
      { value: "3", info: "3" },
      { value: "4", info: "4 (fast)" },
    ],
    // shape
    [
      { value: "0", info: "Saw Up" },
      { value: "1", info: "Saw Down" },
      { value: "2", info: "Square" },
      { value: "3", info: "Sine" },
    ],
  ];

  let suggestions = [];

  $: if ($event) {
    updateSuggestions();
  }

  function updateSuggestions() {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = _suggestions.map((s, i) => {
      if (i === 1) {
        const target = event.parent as GridElement;
        return Grid.Protocol.getLayerSuggestions(target.type);
      } else {
        return [...localDefinitions, ...s];
      }
    });
  }
</script>

<config-led-phase class="flex flex-col w-full p-2 pointer-events-auto">
  <div class="w-full flex flex-col p-2">
    <div class="text-gray-500 text-sm pb-1 font-bold">
      Start a periodic animation on the LED
    </div>
  </div>

  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    {#each [scriptSegments[0], scriptSegments[1]] as script, i}
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

  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    {#each [scriptSegments[2], scriptSegments[3], scriptSegments[4]] as script, i}
      <MeltCombo
        title={parameterNames[i + 2]}
        value={script}
        suggestions={suggestions[i + 2]}
        validator={validators[i + 2].func}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          script = value;
          validators[i + 2].value = !validationError;
          sendData(value, i + 2);
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    {/each}
  </div>
</config-led-phase>
