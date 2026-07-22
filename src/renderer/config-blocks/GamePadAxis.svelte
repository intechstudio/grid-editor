<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "ggms",
    name: "GamePadAxis",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/gamepad/gamepad-axis",
    category: "hid",
    displayName: "GamePad Axis",
    description: "Move a virtual gamepad axis",
    defaultLua: "ggms(0,0)",
    color: categoryColors["hid"] as any,
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5V9.6"/><circle cx="12" cy="7" r="2.6"/><path d="M8 15.5h8l1.5 4h-11Z"/><path d="M5.6 8.7a6.8 6.8 0 0 1 1.6-3.6M18.4 8.7a6.8 6.8 0 0 0-1.6-3.6"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 15.5V9.6"/><circle cx="12" cy="7" r="2.6"/><path d="M8 15.5h8l1.5 4h-11Z"/><path d="M5.6 8.7a6.8 6.8 0 0 1 1.6-3.6M18.4 8.7a6.8 6.8 0 0 0-1.6-3.6"/></svg>`,
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
  import { onMount, createEventDispatcher } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";

  import { Script } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";

  import { Validator } from "./validators";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";

  export let action: GridAction;

  let event = action.parent as GridEvent;

  const dispatch = createEventDispatcher();

  const parameterNames = ["Axis", "Position (-128 to 127)"];
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

  // config.script cannot be undefined
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
      { value: "0", info: "X Axis" },
      { value: "1", info: "Y Axis" },
      { value: "2", info: "Z Axis" },
      { value: "3", info: "RX Axis" },
      { value: "4", info: "RY Axis" },
      { value: "5", info: "RZ Axis" },
    ],
    [],
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
  <div class="w-full flex flex-row gap-2">
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
