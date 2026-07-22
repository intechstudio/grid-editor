<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "glut",
    name: "Lookup",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/variables/lookup-variables/",
    category: "variables",
    displayName: "Lookup",
    description: "Map input values to new output values",
    color: categoryColors["variables"] as any,
    defaultLua: "glut(param1,36,0,37,1)",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m16 3.5 4 4-4 4M20 7.5H7M8 20.5l-4-4 4-4M4 16.5h13"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m16 3.5 4 4-4 4M20 7.5H7M8 20.5l-4-4 4-4M4 16.5h13"/></svg>`,
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
  import {
    MeltCombo,
    MoltenPushButton,
    type MeltComboData,
  } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";

  import { Validator } from "./validators";
  import { Script } from "./_script_parsers.js";

  export let action: GridAction;

  type Pair = {
    input: MeltComboData;
    output: MeltComboData;
  };

  const dispatch = createEventDispatcher();

  let validators = [
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaValue().Result();
      },
    },
    {
      value: true,
      func: (e: string) => {
        return new Validator(e).isLuaVariable().Result();
      },
    },
  ];

  let event = action.parent as GridEvent;

  let lookupTable: { pairs: Pair[]; destination: string; source: string };

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    lookupTable = createLookupTable(data.script);
  }

  let suggestions = [];
  $: {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = localDefinitions;
  }

  function sendData() {
    const script = Script.toScript({
      short: action.short,
      array: [
        lookupTable.source,
        lookupTable.pairs.reduce(
          (a, c) => [...a, c.input.value, c.output.value],
          [],
        ),
      ],
    });

    dispatch("update-action", {
      short: action.short,
      script: `${lookupTable.destination}=${script}`,
      validationError:
        validators.some((e) => e.value === false) ||
        lookupTable.pairs.some(
          (e) =>
            e.input.validator.value === false ||
            e.output.validator.value === false,
        ),
    });
  }

  function createLookupTable(script: string) {
    let split_script = script.split("glut");

    const destination_part = split_script[0].trim().slice(0, -1);
    let function_part = split_script[1].trim().slice(1, -1).split(",");

    const source = function_part[0];
    const pairs = function_part.slice(1);

    let pairObjects: Pair[] = [];
    for (let i = 0; i < pairs.length; i += 2) {
      pairObjects.push({
        input: {
          value: pairs[i],
          suggestions: [],
          validator: {
            value: true,
            func: (e: string) => {
              return new Validator(e).isLuaValue().Result();
            },
          },
        },
        output: {
          value: pairs[i + 1],
          suggestions: [],
          validator: {
            value: true,
            func: (e: string) => {
              return new Validator(e).isLuaValue().Result();
            },
          },
        },
      });
    }

    return {
      destination: destination_part,
      source: source,
      pairs: pairObjects,
    };
  }

  function addNewLine() {
    lookupTable.pairs = [
      ...lookupTable.pairs,
      {
        input: {
          value: "",
          suggestions: [],
          validator: {
            value: true,
            func: (e: string) => {
              return new Validator(e).isLuaValue().Result();
            },
          },
        },
        output: {
          value: "",
          suggestions: [],
          validator: {
            value: true,
            func: (e: string) => {
              return new Validator(e).isLuaValue().Result();
            },
          },
        },
      },
    ];
    sendData();
    dispatch("sync");
  }

  function removeLine(i: number) {
    lookupTable.pairs.splice(i, 1);
    sendData();
    dispatch("sync");
  }
</script>

<config-lookup class="flex flex-col w-full p-2 pointer-events-auto">
  <MeltCombo
    title={"Source"}
    {suggestions}
    placeholder={"Incoming value to match"}
    value={lookupTable.source}
    validator={validators[0].func}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      lookupTable.source = value;
      validators[0].value = !validationError;
      dispatch("validation", { value: validationError });
      sendData();
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <div class="w-full p-2 flex flex-col">
    <div class="flex text-gray-500 text-sm">
      <div class="w-1/2">Input</div>
      <div class="w-1/2 -ml-2">Output</div>
    </div>

    {#each lookupTable.pairs as pair, i}
      <div class="w-full flex flex-row gap-2 items-center">
        <MeltCombo
          title=" "
          placeholder="input"
          bind:value={pair.input.value}
          validator={pair.input.validator.func}
          on:input={(e) => {
            const { value, validationError } = e.detail;
            pair.input.validator.value = !validationError;
            sendData();
          }}
          on:change={() => dispatch("sync")}
        />
        <MeltCombo
          title=" "
          placeholder="output"
          bind:value={pair.output.value}
          validator={pair.output.validator.func}
          on:input={(e) => {
            const { value, validationError } = e.detail;
            pair.output.validator.value = !validationError;
            sendData();
          }}
          on:change={() => dispatch("sync")}
        />

        <button
          class:invisible={i === 0 && lookupTable.pairs.length === 1}
          on:click={() => {
            removeLine(i);
          }}
          class="flex group cursor-pointer"
        >
          <svg
            class="w-5 h-5 p-1 fill-current group-hover:text-white text-gray-500"
            viewBox="0 0 29 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.37506 0.142151L28.4264 26.1935L26.1934 28.4264L0.142091 2.37512L2.37506 0.142151Z"
            />
            <path
              d="M28.4264 2.37512L2.37506 28.4264L0.14209 26.1935L26.1934 0.142151L28.4264 2.37512Z"
            />
          </svg>
        </button>
      </div>
    {/each}
  </div>

  <MeltCombo
    title={"Destination"}
    placeholder={"Variable name to load the lookup result"}
    {suggestions}
    value={lookupTable.destination}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      lookupTable.destination = value;
      validators[1].value = !validationError;
      dispatch("validation", { value: validationError });
      sendData();
    }}
    validator={validators[1].func}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />

  <div class="self-center">
    <MoltenPushButton text="Add New Pair" click={addNewLine} />
  </div>
</config-lookup>
