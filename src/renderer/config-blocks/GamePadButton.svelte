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
    category: "hid",
    displayName: "GamePad Button",
    defaultLua: "ggbs(0,0)",
    color: categoryColors["hid"] as any,
    icon: `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 256 256" xml:space="preserve">

<defs>
</defs>
<g style="stroke: black; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)" >
	<path d="M 8.804 74.995 c -1.95 0 -3.873 -0.661 -5.452 -1.926 c -2.354 -1.885 -3.592 -4.798 -3.311 -7.792 c 1.122 -15.36 3.548 -26.771 7.63 -35.871 c 2.565 -5.72 9.033 -8.626 15.051 -6.762 c 2.088 0.647 4.109 1.349 6.064 2.027 c 5.595 1.941 10.879 3.775 16.214 3.775 s 10.62 -1.834 16.215 -3.775 c 1.954 -0.679 3.976 -1.38 6.063 -2.027 c 6.02 -1.866 12.486 1.041 15.051 6.762 c 4.083 9.101 6.509 20.513 7.634 35.913 c 0.277 2.952 -0.961 5.865 -3.315 7.75 c -2.305 1.846 -5.342 2.404 -8.123 1.502 c -5.184 -1.685 -9.762 -4.391 -14.19 -7.007 C 57.972 63.805 51.964 60.255 45 60.255 s -12.973 3.551 -19.335 7.309 c -4.428 2.616 -9.007 5.322 -14.19 7.007 C 10.6 74.855 9.699 74.995 8.804 74.995 z M 19.02 26.082 c -3.252 0 -6.315 1.876 -7.699 4.961 c -3.832 8.543 -6.218 19.85 -7.294 34.567 c -0.158 1.69 0.525 3.296 1.825 4.336 c 1.268 1.016 2.867 1.315 4.387 0.82 c 4.764 -1.548 9.15 -4.14 13.391 -6.645 c 6.545 -3.867 13.313 -7.866 21.37 -7.866 c 8.057 0 14.825 3.999 21.37 7.866 c 4.241 2.506 8.628 5.098 13.391 6.645 c 1.52 0.494 3.119 0.194 4.388 -0.82 c 1.3 -1.04 1.983 -2.645 1.828 -4.294 c -1.078 -14.758 -3.464 -26.065 -7.298 -34.609 c -1.738 -3.878 -6.138 -5.846 -10.216 -4.579 c -2.024 0.628 -4.014 1.318 -5.938 1.986 C 56.603 30.505 51.01 32.447 45 32.447 s -11.603 -1.941 -17.526 -3.997 c -1.924 -0.667 -3.913 -1.358 -5.937 -1.986 C 20.703 26.205 19.854 26.082 19.02 26.082 z" style="stroke: black; stroke-width: 1.5.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
	<circle cx="68.287" cy="38.147" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<circle cx="68.287" cy="50.836999999999996" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<circle cx="61.947" cy="44.487" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<circle cx="74.627" cy="44.487" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<path d="M 30.664 44.49 c 0 -1.26 -1.025 -2.285 -2.286 -2.285 H 24 v -4.379 c 0 -1.261 -1.025 -2.286 -2.286 -2.286 c -1.261 0 -2.286 1.025 -2.286 2.286 v 4.379 h -4.379 c -1.261 0 -2.286 1.025 -2.286 2.285 c 0 1.261 1.025 2.286 2.286 2.286 h 4.379 v 4.379 c 0 1.26 1.025 2.285 2.286 2.285 c 1.261 0 2.286 -1.025 2.286 -2.285 v -4.379 h 4.379 C 29.639 46.776 30.664 45.75 30.664 44.49 z" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
</g>
</svg>
    `,
    blockIcon: `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 256 256" xml:space="preserve">

<defs>
</defs>
<g style="stroke: black; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)" >
	<path d="M 8.804 74.995 c -1.95 0 -3.873 -0.661 -5.452 -1.926 c -2.354 -1.885 -3.592 -4.798 -3.311 -7.792 c 1.122 -15.36 3.548 -26.771 7.63 -35.871 c 2.565 -5.72 9.033 -8.626 15.051 -6.762 c 2.088 0.647 4.109 1.349 6.064 2.027 c 5.595 1.941 10.879 3.775 16.214 3.775 s 10.62 -1.834 16.215 -3.775 c 1.954 -0.679 3.976 -1.38 6.063 -2.027 c 6.02 -1.866 12.486 1.041 15.051 6.762 c 4.083 9.101 6.509 20.513 7.634 35.913 c 0.277 2.952 -0.961 5.865 -3.315 7.75 c -2.305 1.846 -5.342 2.404 -8.123 1.502 c -5.184 -1.685 -9.762 -4.391 -14.19 -7.007 C 57.972 63.805 51.964 60.255 45 60.255 s -12.973 3.551 -19.335 7.309 c -4.428 2.616 -9.007 5.322 -14.19 7.007 C 10.6 74.855 9.699 74.995 8.804 74.995 z M 19.02 26.082 c -3.252 0 -6.315 1.876 -7.699 4.961 c -3.832 8.543 -6.218 19.85 -7.294 34.567 c -0.158 1.69 0.525 3.296 1.825 4.336 c 1.268 1.016 2.867 1.315 4.387 0.82 c 4.764 -1.548 9.15 -4.14 13.391 -6.645 c 6.545 -3.867 13.313 -7.866 21.37 -7.866 c 8.057 0 14.825 3.999 21.37 7.866 c 4.241 2.506 8.628 5.098 13.391 6.645 c 1.52 0.494 3.119 0.194 4.388 -0.82 c 1.3 -1.04 1.983 -2.645 1.828 -4.294 c -1.078 -14.758 -3.464 -26.065 -7.298 -34.609 c -1.738 -3.878 -6.138 -5.846 -10.216 -4.579 c -2.024 0.628 -4.014 1.318 -5.938 1.986 C 56.603 30.505 51.01 32.447 45 32.447 s -11.603 -1.941 -17.526 -3.997 c -1.924 -0.667 -3.913 -1.358 -5.937 -1.986 C 20.703 26.205 19.854 26.082 19.02 26.082 z" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
	<circle cx="68.287" cy="38.147" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<circle cx="68.287" cy="50.836999999999996" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<circle cx="61.947" cy="44.487" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<circle cx="74.627" cy="44.487" r="2.607" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform="  matrix(1 0 0 1 0 0) "/>
	<path d="M 30.664 44.49 c 0 -1.26 -1.025 -2.285 -2.286 -2.285 H 24 v -4.379 c 0 -1.261 -1.025 -2.286 -2.286 -2.286 c -1.261 0 -2.286 1.025 -2.286 2.286 v 4.379 h -4.379 c -1.261 0 -2.286 1.025 -2.286 2.285 c 0 1.261 1.025 2.286 2.286 2.286 h 4.379 v 4.379 c 0 1.26 1.025 2.285 2.286 2.285 c 1.261 0 2.286 -1.025 2.286 -2.285 v -4.379 h 4.379 C 29.639 46.776 30.664 45.75 30.664 44.49 z" style="stroke: black; stroke-width: 1.5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
</g>
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
