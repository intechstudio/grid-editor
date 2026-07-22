<script lang="ts" context="module">
  import { midiCC } from "./_midi.js";
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import MidiFourteenBitFace from "./headers/MidiFourteenBitFace.svelte";
  export const header = MidiFourteenBitFace;

  export const information: ActionBlockInformation = {
    short: "gmsh",
    name: "MidiFourteenBit",
    rendering: "standard",
    category: "deprecated",
    displayName: "MIDI 14",
    description: "Send high-resolution 14-bit MIDI",
    documentationUrl: "https://docs.intech.studio/wiki/actions/midi/midi-14bit",
    color: categoryColors["deprecated"] as any,
    defaultLua: "gms(0,176,0,val//128) gms(0,176,32,val%128)",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="M9.5 12h5M12 9.5v5"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="M9.5 12h5M12 9.5v5"/></svg>`,
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
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";

  import { Script } from "./_script_parsers.js";
  import { Validator } from "./validators";
  import { Grid } from "../lib/_utils.js";

  export let action: GridAction;

  let event = action.parent as GridEvent;

  const dispatch = createEventDispatcher();

  const parameterNames = ["Channel", "CC number", "Controller Value"];
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
  ];

  let scriptSegments = [];

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    const matches = [];
    const regex = /gms\((.*?[^)])\)(?=\s|$)/g;

    let match;
    while ((match = regex.exec(data.script)) !== null) {
      matches.push(
        Script.toSegments({ short: "gms", script: `gms(${match[1].trim()})` }),
      );
    }

    let param_array = matches[0];

    let value = param_array[3].split("//").slice(0, -1).join("//");

    let param_object = {
      channel: param_array[0],
      base: param_array[2],
      value: value,
    };

    scriptSegments = [
      param_object.channel,
      param_object.base,
      param_object.value,
    ];
  }

  function sendData(e, index) {
    scriptSegments[index] = e;

    let script = `gms(${scriptSegments[0]},176,${scriptSegments[1]},${scriptSegments[2]}//128) gms(${scriptSegments[0]},176,${scriptSegments[1]}+32,${scriptSegments[2]}%128)`;
    dispatch("update-action", {
      short: action.short,
      script: script,
      validationError: validators.some((e) => e.value === false),
    });
  }

  const channels = (length) => {
    let arr = [];
    for (let i = 0; i < length; i++) {
      arr[i] = { value: i, info: `Channel ${i + 1}` };
    }
    return arr;
  };

  const _suggestions = [
    // channels
    [...channels(16)],
    // param 1
    Object.entries(midiCC).map(([value, info]) => ({
      value: Number(value),
      info,
    })),
    // param 2
    [
      //{value: '', info: 'to do...'}
    ],
  ];

  let suggestions = [];

  function renderSuggestions() {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });

    suggestions[0] = [
      {
        value: "-1",
        info: `Auto (${Grid.Auto.getMidiChannelLabel(action)})`,
        key: "auto",
      },
      ..._suggestions[0],
    ];
    suggestions[1] = [
      {
        value: "-1",
        info: `Auto (${Grid.Auto.getMidi(action, Grid.Auto.Value.MIDI_P1)})`,
        key: "auto",
      },
      ..._suggestions[1],
    ];
    suggestions[2] = [
      {
        value: "-1",
        info: `Auto`,
        key: "auto",
      },
      ...localDefinitions,
    ];
  }

  $: if ($event) {
    renderSuggestions();
  }
</script>

<action-midi class="flex flex-col w-full pb-2 px-2 pointer-events-auto">
  <div class="w-full text-yellow-400 text-xs px-1 py-2">
    This block is deprecated. Use the MIDI block with CC 14-bit mode instead.
  </div>
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

  <div class="mt-2"></div>
</action-midi>
