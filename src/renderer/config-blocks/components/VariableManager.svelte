<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { parenthesis, Validator } from "../_validators.js";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { MeltCombo, MoltenPushButton } from "@intechstudio/grid-uikit";
  import { checkVariableName } from "../../validators/local_validator.mjs";
  import { find_forbidden_identifiers } from "../../runtime/monaco-helper.js";

  const dispatch = createEventDispatcher();
  type ScriptSegment = { name: string; value: string };

  export let script: string;
  export let availableCharacters: number;
  export let preProcessor: (script: string) => string;
  export let postProcessor: (script: string) => string;

  let errorText = "";
  let segments: ScriptSegment[] = [];

  $: handleScriptChange(script);

  function handleScriptChange(script: string) {
    const processed = preProcessor(script);
    segments = parseVariableAssignments(processed);
    for (const segment of segments) {
      segment.value = GridScript.humanize(segment.value);
    }
    updateErrorText();
  }

  function splitParts(expression: string): string[] {
    const parts: string[] = [];
    let currentPart = "";
    for (const char of Array.from(expression)) {
      const isParenthesesBalanced = parenthesis(currentPart);
      if (isParenthesesBalanced && char === ",") {
        parts.push(currentPart);
        currentPart = "";
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart);
    return parts;
  }

  function parseVariableAssignments(
    statement: string
  ): ScriptSegment[] | undefined {
    if (!parenthesis(statement)) {
      return;
    }

    const assignments: ScriptSegment[] = [];
    const variableNames = splitParts(statement.split("=")[0]);
    const variableValues = splitParts(statement.split("=")[1]);

    if (variableNames.length !== variableValues.length) {
      throw new Error("Error parsing variables: mismatched names and values!");
    }

    for (let i = 0; i < variableNames.length; i++) {
      assignments.push({
        name: variableNames[i],
        value: variableValues[i],
      });
    }

    return assignments;
  }

  function buildScript(segments: ScriptSegment[]) {
    const variables = segments.map((segment) => segment.name).join(",");
    const values = segments.map((segment) => segment.value).join(",");
    return `${variables}=${values}`;
  }

  function updateErrorText() {
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
    const obj = { name: "", value: "" };
    segments.push(obj);
    sendData();
  }

  function removeVariable(index: number) {
    segments = segments.filter((e, i) => i !== index);
    sendData();
  }
</script>

<container>
  <div class="flex flex-col gap-2">
    {#key segments.length}
      {#each segments as segment, i}
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
              removeVariable(i);
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
    {/key}
    <div data-testid="add-variable" class="self-center">
      <MoltenPushButton click={addVariable} text={`Add New Variable`} />
    </div>
  </div>
</container>
