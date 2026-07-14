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
    color: categoryColors["led"] as any,
    defaultLua: "self:glp(-1,-1)",
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 303 303" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M204.8 97.6C191.2 84 172 75.2 151.2 75.2C130.4 75.2 111.2 83.6 97.6 97.6C84 111.2 75.2 130.4 75.2 151.2C75.2 172 84 191.2 97.6 204.8C111.2 218.4 130.4 227.2 151.2 227.2C172 227.2 191.2 218.8 204.8 204.8C218.4 191.2 227.2 172 227.2 151.2C227.2 130.4 218.8 111.2 204.8 97.6ZM190.4 190.4C180.4 200.4 166.4 206.4 151.2 206.4C136 206.4 122 200.4 112 190.4C102 180.4 96 166.4 96 151.2C96 136 102 122 112 112C122 102 136 96 151.2 96C166.4 96 180.4 102 190.4 112C200.4 122 206.4 136 206.4 151.2C206.4 166.4 200.4 180.4 190.4 190.4Z" fill="black"/>
      <path d="M292 140.8H261.2C255.6 140.8 250.8 145.6 250.8 151.2C250.8 156.8 255.6 161.6 261.2 161.6H292C297.6 161.6 302.4 156.8 302.4 151.2C302.4 145.6 297.6 140.8 292 140.8Z" fill="black"/>
      <path d="M151.2 250.8C145.6 250.8 140.8 255.6 140.8 261.2V292C140.8 297.6 145.6 302.4 151.2 302.4C156.8 302.4 161.6 297.6 161.6 292V261.2C161.6 255.6 156.8 250.8 151.2 250.8Z" fill="black"/>
      <path d="M258 243.6L236 221.6C232.4 217.6 225.6 217.6 221.6 221.6C217.6 225.6 217.6 232 221.6 236L243.6 258C247.6 262 254 262 258 258C262 254 262 247.6 258 243.6Z" fill="black"/>
      <path d="M151.2 0C145.6 0 140.8 4.8 140.8 10.4V41.2C140.8 46.8 145.6 51.6 151.2 51.6C156.8 51.6 161.6 46.8 161.6 41.2V10.4C161.6 4.8 156.8 0 151.2 0Z" fill="black"/>
      <path d="M258.4 44.4C254.4 40.4 248 40.4 244 44.4L222 66.4C218 70.4 218 76.8 222 80.8C225.6 84.8 232.4 84.8 236.4 80.8L258.4 58.8C262.4 54.8 262.4 48.4 258.4 44.4Z" fill="black"/>
      <path d="M41.2 140.8H10.4C4.8 140.8 0 145.6 0 151.2C0 156.8 4.4 161.6 10.4 161.6H41.2C46.8 161.6 51.6 156.8 51.6 151.2C51.6 145.6 46.8 140.8 41.2 140.8Z" fill="black"/>
      <path d="M80.4 221.6C76.8 217.6 70 217.6 66 221.6L44 243.6C40 247.6 40 254 44 258C48 262 54.4 262 58.4 258L80.4 236C84.4 232 84.4 225.6 80.4 221.6Z" fill="black"/>
      <path d="M80.4 66.4L58.4 44.4C54.4 40.4 48 40.4 44 44.4C40 48.4 40 54.8 44 58.8L66 80.8C70 84.8 76.4 84.8 80.4 80.8C84.4 76.8 84.4 70.4 80.4 66.4Z" fill="black"/>
    </svg>
    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 303 303" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M204.8 97.6C191.2 84 172 75.2 151.2 75.2C130.4 75.2 111.2 83.6 97.6 97.6C84 111.2 75.2 130.4 75.2 151.2C75.2 172 84 191.2 97.6 204.8C111.2 218.4 130.4 227.2 151.2 227.2C172 227.2 191.2 218.8 204.8 204.8C218.4 191.2 227.2 172 227.2 151.2C227.2 130.4 218.8 111.2 204.8 97.6ZM190.4 190.4C180.4 200.4 166.4 206.4 151.2 206.4C136 206.4 122 200.4 112 190.4C102 180.4 96 166.4 96 151.2C96 136 102 122 112 112C122 102 136 96 151.2 96C166.4 96 180.4 102 190.4 112C200.4 122 206.4 136 206.4 151.2C206.4 166.4 200.4 180.4 190.4 190.4Z" fill="black"/>
      <path d="M292 140.8H261.2C255.6 140.8 250.8 145.6 250.8 151.2C250.8 156.8 255.6 161.6 261.2 161.6H292C297.6 161.6 302.4 156.8 302.4 151.2C302.4 145.6 297.6 140.8 292 140.8Z" fill="black"/>
      <path d="M151.2 250.8C145.6 250.8 140.8 255.6 140.8 261.2V292C140.8 297.6 145.6 302.4 151.2 302.4C156.8 302.4 161.6 297.6 161.6 292V261.2C161.6 255.6 156.8 250.8 151.2 250.8Z" fill="black"/>
      <path d="M258 243.6L236 221.6C232.4 217.6 225.6 217.6 221.6 221.6C217.6 225.6 217.6 232 221.6 236L243.6 258C247.6 262 254 262 258 258C262 254 262 247.6 258 243.6Z" fill="black"/>
      <path d="M151.2 0C145.6 0 140.8 4.8 140.8 10.4V41.2C140.8 46.8 145.6 51.6 151.2 51.6C156.8 51.6 161.6 46.8 161.6 41.2V10.4C161.6 4.8 156.8 0 151.2 0Z" fill="black"/>
      <path d="M258.4 44.4C254.4 40.4 248 40.4 244 44.4L222 66.4C218 70.4 218 76.8 222 80.8C225.6 84.8 232.4 84.8 236.4 80.8L258.4 58.8C262.4 54.8 262.4 48.4 258.4 44.4Z" fill="black"/>
      <path d="M41.2 140.8H10.4C4.8 140.8 0 145.6 0 151.2C0 156.8 4.4 161.6 10.4 161.6H41.2C46.8 161.6 51.6 156.8 51.6 151.2C51.6 145.6 46.8 140.8 41.2 140.8Z" fill="black"/>
      <path d="M80.4 221.6C76.8 217.6 70 217.6 66 221.6L44 243.6C40 247.6 40 254 44 258C48 262 54.4 262 58.4 258L80.4 236C84.4 232 84.4 225.6 80.4 221.6Z" fill="black"/>
      <path d="M80.4 66.4L58.4 44.4C54.4 40.4 48 40.4 44 44.4C40 48.4 40 54.8 44 58.8L66 80.8C70 84.8 76.4 84.8 80.4 80.8C84.4 76.8 84.4 70.4 80.4 66.4Z" fill="black"/>
    </svg>
    `,
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
