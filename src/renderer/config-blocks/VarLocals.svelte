<script context="module">
  export const information = {
    short: "l",
    name: "VarLocals",
    rendering: "standard",
    category: "variables",
    desc: "Locals",
    blockTitle: "Locals",
    defaultLua: "local num = self:ind()",
    color: "#78BC61",
    icon: `<span class="block w-full text-black text-center italic font-gt-pressura">L</span>`,
    blockIcon: `<span class="block w-full text-black text-center italic font-gt-pressura">L</span>`,
    selectable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import stringManipulation from "../main/user-interface/_string-operations";

  import { parenthesis } from "./_validators.js";

  import SendFeedback from "../main/user-interface/SendFeedback.svelte";

  import { checkVariableName } from "../validators/local_validator.mjs";

  import { find_forbidden_identifiers } from "../runtime/monaco-helper";
  let error_messsage = "";

  export let config = "";
  export let index;
  export let access_tree;

  import LineEditor from "../main/user-interface/LineEditor.svelte";

  let sidebarWidth;

  const dispatch = createEventDispatcher();

  /**
   * Locals specific variables
   * @locals []
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
    scriptSegments = localsToConfig({ script: config.script });

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function saveChangesOnInput(e, i, k) {
    scriptSegments[i][k] = e;

    codeEditorContent = localArrayToScript(scriptSegments);

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

  function humanizeLocals(segments) {
    return segments.map((elem) => {
      elem.value = stringManipulation.humanize(elem.value);
      return elem;
    });
  }

  let rerenderList = 0;

  // Commit button
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
      dispatch("output", { short: "l", script: outputCode });
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

  function localArrayToScript(arr) {
    let script = [
      "local ",
      arr.map((e) => e.variable).join(","),
      "=",
      arr.map((e) => e.value).join(","),
    ].join("");
    return script;
  }

  function localsToConfig({ script }) {
    if (parenthesis(script)) {
      // this had to be moved out of locals function, as array refresh was killed by $ with scriptSegments..
      let _variable_array = script.split("=")[0];
      _variable_array = _variable_array.split("local")[1];
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

      arr = humanizeLocals(arr);

      return arr;
    }
  }

  function addLocalVariable() {
    scriptSegments = [...scriptSegments, { variable: "", value: "" }];
    codeEditorContent = localArrayToScript(scriptSegments);
  }

  function removeLocalVariable(i) {
    scriptSegments.splice(i, 1);
    scriptSegments = [...scriptSegments];
    codeEditorContent = localArrayToScript(scriptSegments);
    sendData();
  }

  onMount(() => {});
</script>

<svelte:window bind:innerWidth={sidebarWidth} />

<config-local-definitions class="flex flex-col w-full p-2">
  <div class="flex justify-between items-center my-2 px-2">
    {#if variableNameError}
      <div class="text-sm text-red-500">Variable name error!</div>
    {/if}
    {#if error_messsage !== ""}
      <div class="text-sm text-red-500">{error_messsage}</div>
    {/if}
    {#key commitState}
      <div
        in:fly={{ x: -5, duration: 200 }}
        class="{commitState ? 'text-yellow-600' : 'text-green-500'} text-sm"
      >
        {commitState ? "Unsaved changes!" : "Synced with Grid!"}
      </div>
    {/key}
    {#if parenthesisError}
      <div class="text-sm text-red-500">Parenthesis must be closed!</div>
    {/if}
    <button
      on:click={() => {
        sendData();
      }}
      disabled={!commitState && parenthesisError && variableNameError}
      class="{commitState && !parenthesisError && !variableNameError
        ? 'opacity-100'
        : 'opacity-50 pointer-events-none'} bg-commit hover:bg-commit-saturate-20 text-white rounded px-2 py-0.5 text-sm focus:outline-none"
      >Commit</button
    >
  </div>

  <div class="w-full flex flex-col p-2">
    {#each scriptSegments as script, i (i)}
      <div class="w-full h-full flex local-defs py-2">
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
          <div class="w-full p-1 bg-secondary">
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
                removeLocalVariable(i);
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
        addLocalVariable();
      }}
      class="group-hover:border-pick cursor-pointer group-hover:bg-select-saturate-10 border-secondary transition-colors duration-300 w-full border-l-4 text-white pl-4 py-0.5"
    >
      Add local variable...
    </button>
  </div>

  <SendFeedback feedback_context="Locals" />
</config-local-definitions>

<style>
  .local-defs:first-child {
    padding-top: 0;
  }
</style>
