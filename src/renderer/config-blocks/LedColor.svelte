<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "glc",
    name: "LedColor",
    category: "led",
    rendering: "standard",
    color: "#726E60",
    displayName: "Color",
    defaultLua: "glc(self:ind(),1,glr(),glg(),glb())",
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 404 404" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 202C0 90.4501 90.4501 0 202 0C312.408 0 404 79.7737 404 180.666C404 245.069 351.736 297.333 287.333 297.333H249.68C237.496 297.333 227.68 307.149 227.68 319.333C227.68 325.01 229.708 330 233.104 333.86C239.962 341.32 244 351.165 244 362C244 385.23 225.23 404 202 404C90.4501 404 0 313.55 0 202ZM202 20C101.496 20 20 101.496 20 202C20 302.504 101.496 384 202 384C214.184 384 224 374.184 224 362C224 356.238 221.884 351.185 218.338 347.349L218.267 347.273L218.198 347.195C211.603 339.757 207.68 330.052 207.68 319.333C207.68 296.103 226.45 277.333 249.68 277.333H287.333C340.69 277.333 384 234.023 384 180.666C384 92.9723 303.646 20 202 20ZM148.667 62.667C136.483 62.667 126.667 72.4828 126.667 84.667C126.667 96.8512 136.483 106.667 148.667 106.667C160.85 106.667 170.667 96.851 170.667 84.667C170.667 72.4828 160.851 62.667 148.667 62.667ZM106.667 84.667C106.667 61.4371 125.437 42.667 148.667 42.667C171.897 42.667 190.667 61.4372 190.667 84.667C190.667 107.897 171.896 126.667 148.667 126.667C125.437 126.667 106.667 107.897 106.667 84.667ZM255.333 62.667C243.149 62.667 233.333 72.4828 233.333 84.667C233.333 96.8512 243.149 106.667 255.333 106.667C267.517 106.667 277.333 96.8512 277.333 84.667C277.333 72.4829 267.517 62.667 255.333 62.667ZM213.333 84.667C213.333 61.4372 232.103 42.667 255.333 42.667C278.563 42.667 297.333 61.4371 297.333 84.667C297.333 107.897 278.563 126.667 255.333 126.667C232.103 126.667 213.333 107.897 213.333 84.667ZM84.667 148C72.4828 148 62.667 157.816 62.667 170C62.667 182.184 72.4828 192 84.667 192C96.8504 192 106.667 182.184 106.667 170C106.667 157.816 96.8512 148 84.667 148ZM42.667 170C42.667 146.77 61.4372 128 84.667 128C107.897 128 126.667 146.77 126.667 170C126.667 193.23 107.896 212 84.667 212C61.4372 212 42.667 193.23 42.667 170ZM319.333 148C307.149 148 297.333 157.816 297.333 170C297.333 182.184 307.149 192 319.333 192C331.517 192 341.333 182.184 341.333 170C341.333 157.816 331.517 148 319.333 148ZM277.333 170C277.333 146.77 296.103 128 319.333 128C342.563 128 361.333 146.77 361.333 170C361.333 193.23 342.563 212 319.333 212C296.103 212 277.333 193.23 277.333 170Z" fill="black"/>
    </svg>`,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 404 404" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 202C0 90.4501 90.4501 0 202 0C312.408 0 404 79.7737 404 180.666C404 245.069 351.736 297.333 287.333 297.333H249.68C237.496 297.333 227.68 307.149 227.68 319.333C227.68 325.01 229.708 330 233.104 333.86C239.962 341.32 244 351.165 244 362C244 385.23 225.23 404 202 404C90.4501 404 0 313.55 0 202ZM202 20C101.496 20 20 101.496 20 202C20 302.504 101.496 384 202 384C214.184 384 224 374.184 224 362C224 356.238 221.884 351.185 218.338 347.349L218.267 347.273L218.198 347.195C211.603 339.757 207.68 330.052 207.68 319.333C207.68 296.103 226.45 277.333 249.68 277.333H287.333C340.69 277.333 384 234.023 384 180.666C384 92.9723 303.646 20 202 20ZM148.667 62.667C136.483 62.667 126.667 72.4828 126.667 84.667C126.667 96.8512 136.483 106.667 148.667 106.667C160.85 106.667 170.667 96.851 170.667 84.667C170.667 72.4828 160.851 62.667 148.667 62.667ZM106.667 84.667C106.667 61.4371 125.437 42.667 148.667 42.667C171.897 42.667 190.667 61.4372 190.667 84.667C190.667 107.897 171.896 126.667 148.667 126.667C125.437 126.667 106.667 107.897 106.667 84.667ZM255.333 62.667C243.149 62.667 233.333 72.4828 233.333 84.667C233.333 96.8512 243.149 106.667 255.333 106.667C267.517 106.667 277.333 96.8512 277.333 84.667C277.333 72.4829 267.517 62.667 255.333 62.667ZM213.333 84.667C213.333 61.4372 232.103 42.667 255.333 42.667C278.563 42.667 297.333 61.4371 297.333 84.667C297.333 107.897 278.563 126.667 255.333 126.667C232.103 126.667 213.333 107.897 213.333 84.667ZM84.667 148C72.4828 148 62.667 157.816 62.667 170C62.667 182.184 72.4828 192 84.667 192C96.8504 192 106.667 182.184 106.667 170C106.667 157.816 96.8512 148 84.667 148ZM42.667 170C42.667 146.77 61.4372 128 84.667 128C107.897 128 126.667 146.77 126.667 170C126.667 193.23 107.896 212 84.667 212C61.4372 212 42.667 193.23 42.667 170ZM319.333 148C307.149 148 297.333 157.816 297.333 170C297.333 182.184 307.149 192 319.333 192C331.517 192 341.333 182.184 341.333 170C341.333 157.816 331.517 148 319.333 148ZM277.333 170C277.333 146.77 296.103 128 319.333 128C342.563 128 361.333 146.77 361.333 170C361.333 193.23 342.563 212 319.333 212C296.103 212 277.333 193.23 277.333 170Z" fill="black"/>
    </svg>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { MeltCombo, MeltSelect } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import Toggle from "../main/user-interface/Toggle.svelte";
  import { ElementType } from "@intechstudio/grid-protocol";
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
  import { Validator } from "./_validators";
  import { Script } from "./_script_parsers.js";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import {
    ActionData,
    GridAction,
    GridElement,
    GridEvent,
  } from "./../runtime/runtime";
  import { Grid } from "../lib/_utils.js";
  import SliderColorPicker from "../main/user-interface/SliderColorPicker.svelte";
  import SquareColorPicker from "../main/user-interface/SquareColorPicker.svelte";
  import RandomColorGenerator from "../main/user-interface/RandomColorGenerator.svelte";

  export let config: GridAction;
  export let index;

  let event = config.parent as GridEvent;
  const dispatch = createEventDispatcher();

  const parameterNames = ["LED Number", "Layer", "Red", "Green", "Blue"];
  const validators = [
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
  ];

  let scriptSegments = [];

  let beautyMode = 0;
  let beautify = true;

  const defaultColor = new Grid.RGB(255, 255, 255).toHSL();
  let color: Grid.HSL = defaultColor;

  $: handleConfigChange($config);

  function handleConfigChange(config: ActionData) {
    const _segments = Script.toSegments({
      short: config.short,
      script: config.script,
    });

    // handle legacy and new beautify command
    if (_segments.length == 6) {
      beautify = +_segments[5] == 1 ? false : true; // check on number instead of string!
      scriptSegments = _segments.slice(0, -1);
    } else {
      scriptSegments = _segments;
      beautify = true;
    }

    color =
      Grid.parseRGB(
        scriptSegments[2],
        scriptSegments[3],
        scriptSegments[4]
      )?.toHSL() ?? defaultColor;
  }

  function changeBeautify() {
    beautyMode = beautify ? 0 : 1;
    sendData();
    dispatch("sync");
  }

  function sendData() {
    const script = Script.toScript({
      short: config.short,
      array: [...scriptSegments, beautyMode],
    });

    dispatch("update-action", { short: config.short, script: script });
  }

  const _suggestions = [
    [],
    [
      { value: "1", info: "layer 1" },
      { value: "2", info: "layer 2" },
    ],
    [],
    [],
    [],
  ];

  let suggestions = [];

  $: if ($event) {
    updateSuggestions();
  }

  function updateSuggestions() {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === config.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = _suggestions.map((s, i) => {
      if (i === 1) {
        const target = event.parent as GridElement;
        switch (target.type) {
          case ElementType.BUTTON:
            return [
              { value: "1", info: "Button layer" },
              { value: "2", info: "Unused layer" },
            ];
          case ElementType.ENCODER:
            return [
              { value: "1", info: "Button layer" },
              { value: "2", info: "Rotation layer" },
            ];
          case ElementType.FADER:
            return [
              { value: "1", info: "Fader layer" },
              { value: "2", info: "Unused layer" },
            ];
          case ElementType.POTMETER:
            return [
              { value: "1", info: "Potmeter layer" },
              { value: "2", info: "Unused layer" },
            ];
        }
      } else {
        return [...localDefinitions, ...s];
      }
    });
  }

  onMount(() => {
    updateSuggestions();
  });

  function updateColor(e: any) {
    const color: Grid.RGB = e.detail.color.toRGB();
    scriptSegments[2] = color.r;
    scriptSegments[3] = color.g;
    scriptSegments[4] = color.b;

    sendData();
  }

  enum ColorPickerModel {
    RGB,
    HSL,
  }

  const colorPickerComponent = new Map([
    [ColorPickerModel.RGB, SquareColorPicker],
    [ColorPickerModel.HSL, SliderColorPicker],
  ]);

  const options = [
    { title: "RGB", value: ColorPickerModel.RGB },
    { title: "HSL", value: ColorPickerModel.HSL },
  ];
  let selected = ColorPickerModel.RGB;
</script>

<config-led-color class="flex flex-col gap-2 w-full p-2 pointer-events-auto">
  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    {#each [scriptSegments[0], scriptSegments[1]] as script, i}
      <MeltCombo
        title={parameterNames[i]}
        bind:value={script}
        validator={validators[i]}
        suggestions={suggestions[i]}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
        on:input={(e) => {
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    {/each}
  </div>

  <div class="text-white">
    <MeltSelect bind:target={selected} {options} disabled={false} />
  </div>
  <div class="grid grid-cols-[1fr_auto] gap-2 items-center">
    <svelte:component
      this={colorPickerComponent.get(selected)}
      {color}
      on:input={updateColor}
      on:change={() => dispatch("sync")}
    />
    <RandomColorGenerator {color} on:generate={updateColor} />
  </div>

  <div class="w-full grid grid-flow-col auto-cols-fr gap-2">
    {#each [2, 3, 4] as i}
      <MeltCombo
        title={parameterNames[i]}
        bind:value={scriptSegments[i]}
        validator={validators[i]}
        suggestions={suggestions[i]}
        on:validator={(e) => {
          const data = e.detail;
          dispatch("validator", data);
        }}
        on:input={(e) => {
          sendData();
        }}
        on:change={() => dispatch("sync")}
        postProcessor={GridScript.shortify}
        preProcessor={GridScript.humanize}
      />
    {/each}
  </div>

  <div class="p-2 flex items-center text-sm text-gray-500">
    <Toggle bind:toggleValue={beautify} on:change={changeBeautify} />
    <div class="pl-2">Beautify is {beautify ? "on" : "off"}.</div>
  </div>

  <SendFeedback
    feedback_context="LedColor"
    class="mt-2 text-sm text-gray-500"
  />
</config-led-color>
