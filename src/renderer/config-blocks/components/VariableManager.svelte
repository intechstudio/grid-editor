<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { parenthesis, Validator } from "../_validators.js";
  import SendFeedback from "../../main/user-interface/SendFeedback.svelte";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { MeltCombo, MoltenPushButton } from "@intechstudio/grid-uikit";
  import { v4 as uuidv4 } from "uuid";
  import { checkVariableName } from "../../validators/local_validator.mjs";
  import { find_forbidden_identifiers } from "../../runtime/monaco-helper.js";

  const dispatch = createEventDispatcher();
  type ScriptSegment = { id: string; name: string; value: string };

  export let type: "Global" | "Locale" | "Self";
  export let script: string;
  export let availableCharacters: number;
  export let preProcessor: (script: string) => string;
  export let postProcessor: (script: string) => string;

  let errorText = "";
  let segments: ScriptSegment[] = [];

  $: handleScriptChange(script);

  function handleScriptChange(script: string) {
    const processed = preProcessor(script);
    segments = parseScript(processed);
    for (const segment of segments) {
      segment.value = GridScript.humanize(segment.value);
    }
    updateErrorText();
  }

  function parseScript(script: string) {
    if (!parenthesis(script)) {
      return;
    }

    const _value_array = script.split("=")[1];

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

    const _variable_array = script.split("=")[0].split(",");
    console.log(_variable_array.length);

    let arr = [];

    slice_pos.forEach((pos, i) => {
      arr.push({
        id: uuidv4(),
        name: _variable_array[i].trim(),
        value: _value_array.slice(pos.off, pos.ind).trim(),
      });
    });

    console.log(arr, script);

    return arr;
  }

  function buildScript(segments: ScriptSegment[]) {
    const variables = segments.map((segment) => segment.name).join(",");
    const values = segments.map((segment) => segment.name).join(",");
    return `${variables}=${values}`;
  }

  function updateErrorText() {
    return;
    console.log(segments);
    let variableNameValidity = [];

    segments.forEach((s) => {
      variableNameValidity.push(checkVariableName(s.name));
    });

    if (variableNameValidity.includes(false)) {
      errorText = "Invalid variable name!";
      return;
    }

    const script = buildScript(segments);

    if (!parenthesis(script)) {
      errorText = "Parenthesis must be closed!";
      return;
    }

    let forbiddenList = find_forbidden_identifiers(script);

    if (forbiddenList.length > 0) {
      const uniqueForbiddenList = [...new Set(forbiddenList)];
      const readable = uniqueForbiddenList.toString().replace(",", ", ");
      errorText = "Reserved identifiers [" + readable + "] cannot be used!";
      return;
    }

    errorText = "";
  }

  function sendData() {
    const built = buildScript(segments);
    const script = postProcessor(built);
    updateErrorText();
    dispatch("script", {
      script: GridScript.shortify(script),
    });
  }

  function addVariable() {
    segments.push({ id: uuidv4(), name: "", value: "" });
    sendData();
  }

  function removeVariable(id: string) {
    //segments = segments.filter((e) => e.id !== id);
    sendData();
  }
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <div class="flex flex-col">
      <span class="text-white text-sm">{type} Variables:</span>
      <span class="text-sm text-error" class:hidden={errorText === ""}
        >Error: {errorText}</span
      >
    </div>

    <div class="flex flex-col gap-2">
      {#each segments as segment, i (segment.id)}
        <div class="grid grid-cols-[25%_1fr_auto] gap-2 items-center">
          <div data-testid="variable-name">
            <MeltCombo
              title=" "
              bind:value={segment.name}
              validator={(e) => {
                return new Validator(e).NotEmpty().Result();
              }}
              on:validator={(e) => {
                const data = e.detail;
                dispatch("validator", data);
              }}
              on:input={(e) => {
                sendData();
              }}
              on:change={() => {
                dispatch("sync");
              }}
            />
          </div>

          <div
            data-testid="variable-value"
            class="border border-black flex items-center flex-grow h-full"
          >
            <LineEditor
              on:input={(e) => {
                segment.value = e.detail.script ?? "";
                sendData();
              }}
              on:change={() => dispatch("sync")}
              value={segment.value}
              {availableCharacters}
            />
          </div>

          <button
            class:invisible={i === 0}
            on:click={() => {
              removeVariable(segment.id);
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

    <div data-testid="add-variable" class="self-center">
      <MoltenPushButton click={addVariable} text={`Add New ${type} Variable`} />
    </div>

    <SendFeedback feedback_context={`${type}s`} class="text-sm text-gray-500" />
  </div>
</container>
