<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "g",
    name: "VarGlobal",
    rendering: "standard",
    category: "variables",
    displayName: "Global",
    defaultLua: "test = self:ind()",
    color: "#78BC61",
    icon: `<span class="block w-full text-black text-center italic font-gt-pressura">G</span>`,
    blockIcon: `<span class="block w-full text-black text-center italic font-gt-pressura">G</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { stringManipulation } from "../main/user-interface/_string-operations";

  import { parenthesis } from "./_validators.js";

  import SendFeedback from "../main/user-interface/SendFeedback.svelte";

  import { checkVariableName } from "../validators/local_validator.mjs";

  import { find_forbidden_identifiers } from "../runtime/monaco-helper";
  let error_messsage = "";

  export let config;
  export let index;
  export let access_tree;

  import LineEditor from "../main/user-interface/LineEditor.svelte";
  import { MoltenPushButton } from "@intechstudio/grid-uikit";

  let sidebarWidth;

  const dispatch = createEventDispatcher();

  /**
   * Globals specific variables
   * @globals []
   */

  let loaded = false;

  let scriptSegments = [{ variable: "", value: "" }];

  let codeEditorContent = "";
  let committedCode = "";
  let parenthesisError = 0;
  let variableNameError = 0;

  export let commitState = 1;

  // config.script cannot be undefined
  $: if (config.script /* && !loaded*/) {
    // this works differently from normal _utils...
    scriptSegments = globalsToConfig({ script: config.script });

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function saveChangesOnInput(e, i, k) {
    scriptSegments[i][k] = e;

    codeEditorContent = globalArrayToScript(scriptSegments);

    let variableNameValidity = [];
    scriptSegments.forEach((s) => {
      variableNameValidity.push(checkVariableName(s.variable));
    });

    if (variableNameValidity.includes(false)) {
      variableNameError = 1;
    } else {
      variableNameError = 0;
    }

    if (parenthesis(codeEditorContent)) {
      parenthesisError = 0;
    } else {
      parenthesisError = 1;
    }
  }

  function humanizeGlobals(segments) {
    return segments.map((elem) => {
      elem.value = stringManipulation.humanize(elem.value);
      return elem;
    });
  }

  let rerenderList = 0;

  function sendData() {
    error_messsage = "";

    let outputCode = codeEditorContent;

    let forbiddenList = find_forbidden_identifiers(outputCode);

    if (forbiddenList.length > 0) {
      const uniqueForbiddenList = [...new Set(forbiddenList)];
      const readable = uniqueForbiddenList.toString().replaceAll(",", ", ");
      error_messsage =
        "Reserved identifiers [" + readable + "] cannot be used!";
      return;
    }

    if (parenthesis(outputCode)) {
      committedCode = outputCode;
      outputCode = stringManipulation.shortify(outputCode);
      dispatch("output", { short: "g", script: outputCode });
      commitState = 0;
    }

    rerenderList++;
  }

  $: {
    if (codeEditorContent.trim() == committedCode.trim()) {
      commitState = 0;
    } else {
      commitState = 1;
    }
  }

  function globalArrayToScript(arr) {
    let script = [
      arr.map((e) => e.variable).join(","),
      "=",
      arr.map((e) => e.value).join(","),
    ].join("");
    return script;
  }

  function globalsToConfig({ script }) {
    if (parenthesis(script)) {
      // this had to be moved out of globals function, as array refresh was killed by $ with scriptSegments..
      let _variable_array = script.split("=")[0];
      let _value_array = script.split("=")[1];

      let slice_pos = [];
      let _part = "";
      let offset = 0;

      Array.from(_value_array).forEach((element, index) => {
        _part += element;
        const closed = parenthesis(_part);
        if (closed && element == ",") {
          slice_pos.push({ off: offset, ind: index });
          offset = index + 1;
        }
        if (index == _value_array.length - 1) {
          slice_pos.push({ off: offset, ind: index + 1 });
        }
      });

      _variable_array = _variable_array.split(",");

      let arr = [];

      slice_pos.forEach((pos, i) => {
        arr.push({
          variable: _variable_array[i].trim(),
          value: _value_array.slice(pos.off, pos.ind).trim(),
        });
      });

      arr = humanizeGlobals(arr);

      return arr;
    }
  }

  function addGlobalVariable() {
    scriptSegments = [...scriptSegments, { variable: "", value: "" }];
    codeEditorContent = globalArrayToScript(scriptSegments);
  }

  function removeGlobalVariable(i) {
    scriptSegments.splice(i, 1);
    scriptSegments = [...scriptSegments];
    codeEditorContent = globalArrayToScript(scriptSegments);
    sendData();
  }

  onMount(() => {});
</script>

<svelte:window bind:innerWidth={sidebarWidth} />

<config-global-definitions
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <div class="flex justify-between items-center my-2 px-2">
    {#if variableNameError}
      <div class="text-sm text-red-500">Variable name error!</div>
    {/if}
    {#if error_messsage !== ""}
      <div class="text-sm text-red-500">{error_messsage}</div>
    {/if}
    {#key commitState}
      <div
        in:fly|global={{ x: -5, duration: 200 }}
        class="{commitState ? 'text-yellow-600' : 'text-green-500'} text-sm"
      >
        {commitState ? "Unsaved changes!" : "Synced with Grid!"}
      </div>
    {/key}
    {#if parenthesisError}
      <div class="text-sm text-red-500">Parenthesis must be closed!</div>
    {/if}
    <MoltenPushButton
      on:click={sendData}
      disabled={Boolean(!commitState || parenthesisError || variableNameError)}
      text={"Commit"}
      style={"accept"}
    />
  </div>

  <div class="w-full flex flex-col p-2">
    {#each scriptSegments as script, i (i)}
      <div class="w-full h-full flex global-defs py-2">
        <div class="w-2/12 pr-1">
          <input
            class="py-1 pl-1 w-full h-full mr-2 bg-secondary text-white"
            placeholder="variable name"
            value={script.variable}
            on:input={(e) => {
              saveChangesOnInput(e.target.value, i, "variable");
            }}
          />
        </div>
        <div class="w-9/12 pl-1">
          <div class="w-full h-full bg-secondary">
            {#key rerenderList}
              <LineEditor
                on:output={(e) => {
                  saveChangesOnInput(e.detail.script, i, "value");
                }}
                {access_tree}
                {sidebarWidth}
                value={script.value}
              />
            {/key}
          </div>
        </div>
        <div class="w-1/12 pl-1 flex items-center justify-center">
          {#if i !== 0}
            <button
              on:click={() => {
                removeGlobalVariable(i);
              }}
              class="flex items-center group cursor-pointer pl-1"
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
          {:else}
            <div class=" flex invisible items-center group cursor-pointer pl-1">
              <div class="w-5 h-5 p-1">x</div>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="w-full flex group p-2">
    <button
      on:click={() => {
        addGlobalVariable();
      }}
      class="group-hover:border-pick cursor-pointer group-hover:bg-select-saturate-10 border-secondary transition-colors duration-300 w-full border-l-4 text-white pl-4 py-0.5"
    >
      Add global variable...
    </button>
  </div>

  <SendFeedback feedback_context="Globals" class="mt-2 text-sm text-gray-500" />
</config-global-definitions>

<style>
  .global-defs:first-child {
    padding-top: 0;
  }
</style>
