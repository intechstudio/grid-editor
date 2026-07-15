<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  import { categoryColors } from "./categoryColors";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "sglp",
    name: "SimpleIntensity",
    rendering: "standard",
    category: "led",
    displayName: "Simple Intensity",
    description: "Set the LED brightness",
    color: categoryColors["led"] as any,
    defaultLua: "self:glp(-1,-1)",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.7M12 18.8v2.7M2.5 12h2.7M18.8 12h2.7M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.7M12 18.8v2.7M2.5 12h2.7M18.8 12h2.7M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9"/></svg>`,
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
  import { BlockRow, MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Script } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { Validator } from "./validators";
  import {
    GridAction,
    GridElement,
    GridEvent,
    GridPage,
  } from "./../runtime/runtime";
  import { Grid } from "../lib/_utils.js";
  import { appSettings } from "../runtime/app-helper.store";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let event = action.parent as GridEvent;
  let element = "self";
  let layer = "-1";
  let intensity = "-1";

  const validators = [
    {
      value: true,
      func: (e: string) => new Validator(e).isLuaValue().Result(),
    }, // element
    {
      value: true,
      func: (e: string) => new Validator(e).isLuaValue().Result(),
    }, // layer
    {
      value: true,
      func: (e: string) => new Validator(e).isLuaValue().Result(),
    }, // intensity
  ];

  let elementSuggestions = [];
  let layerSuggestions = [];
  let intensitySuggestions = [];

  function buildScript() {
    return Script.toScript({
      short: `${element}:glp`,
      array: [layer, intensity],
    });
  }

  $: if (!$action.invalid) {
    if (action.script !== buildScript()) handleActionChange(action);
  }

  function handleActionChange(action: GridAction) {
    const colonIdx = action.script.indexOf(":glp(");
    if (colonIdx === -1) return;
    element = action.script.substring(0, colonIdx);
    const glpPart = action.script.substring(colonIdx + 1);
    const segments = Script.toSegments({ short: "glp", script: glpPart });
    layer = segments[0];
    intensity = segments[1];
  }

  function sendData() {
    const script = buildScript();
    dispatch("update-action", {
      short: action.short,
      script,
      validationError: validators.some((v) => v.value === false),
    });
  }

  $: if ($event) {
    updateSuggestions();
  }

  function updateSuggestions() {
    const gridElement = event.parent as GridElement;
    const page = gridElement.parent as GridPage;

    elementSuggestions = [
      { value: "self", info: "Self (Default)" },
      ...page.control_elements.map((e) => ({
        value: `element[${e.elementIndex}]`,
        info: e.getHumanName(),
      })),
    ];

    layerSuggestions = Grid.Protocol.getLayerSuggestions(gridElement.type);

    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index,
    });
    intensitySuggestions = [{ value: "-1", info: "Auto" }, ...localDefinitions];
  }

  onMount(() => {
    updateSuggestions();
  });
</script>

<config-simple-intensity
  class="flex flex-col gap-2 w-full p-2 pointer-events-auto"
>
  {#if $appSettings.persistent.userLevelMinimalist == false}
    <BlockRow>
      <MeltCombo
        title={"Element"}
        value={element}
        validator={validators[0].func}
        suggestions={elementSuggestions}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          element = value;
          validators[0].value = !validationError;
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
      <MeltCombo
        title={"Layer"}
        value={layer}
        validator={validators[1].func}
        suggestions={layerSuggestions}
        on:input={(e) => {
          const { value, validationError } = e.detail;
          layer = value;
          validators[1].value = !validationError;
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    </BlockRow>
    {#if element !== "self"}
      <p style="color: color-mix(in srgb, #EAB308 75%, var(--foreground));">
        Auto values (-1) use the calling event's context. Specify explicit
        values when targeting another element.
      </p>
    {/if}
  {/if}
  <MeltCombo
    title={"Intensity"}
    value={intensity}
    validator={validators[2].func}
    suggestions={intensitySuggestions}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      intensity = value;
      validators[2].value = !validationError;
      sendData();
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />
</config-simple-intensity>
