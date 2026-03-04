<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { ElementType } from "@intechstudio/grid-protocol";
  import { Validator } from "../validators";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { MeltCombo, MoltenPushButton } from "@intechstudio/grid-uikit";
  import { Grid } from "../../lib/_utils";

  const dispatch = createEventDispatcher();
  type ScriptSegment = { name: string; value: string };

  export let script: string;
  export let availableCharacters: number;
  export let preProcessor: (script: string) => string;
  export let postProcessor: (script: string) => string;
  export let restrictScopeTo: ElementType | undefined = undefined;

  let validators = [];

  let segments: ScriptSegment[] = [];

  $: handleScriptChange(script);

  function handleScriptChange(script: string) {
    if (script === buildScript(segments)) {
      return;
    }

    segments = parseVariableAssignments(script);

    validators = segments.map((e) =>
      Object({
        value: true,
        func: (e) => new Validator(e).isLuaVariable().Result(),
      }),
    );
  }

  function isParenthesisClosed(value: string) {
    const pairs = [
      { start: "(", end: ")" },
      { start: "[", end: "]" },
      { start: "{", end: "}" },
    ];
    const stacks = new Map();

    // Initialize stacks for each pair
    pairs.forEach((pair) => {
      stacks.set(pair, []);
    });

    // Process each character in the input value
    for (const char of value) {
      // Find the corresponding pair for the current character
      const pair = pairs.find((e) => e.start === char || e.end === char);

      // If no pair is found (invalid character), continue
      if (!pair) continue;

      // Check if the character is a start or end bracket for the pair
      switch (char) {
        case pair.start:
          stacks.get(pair).push(char); // Push to the stack of the corresponding pair
          break;
        case pair.end:
          // Check if there's a corresponding start, and pop from the stack
          if (stacks.get(pair).length === 0) {
            return false; // Unmatched closing bracket
          }
          stacks.get(pair).pop();
          break;
      }
    }

    // Check if all stacks are empty, meaning all parentheses are closed correctly
    return [...stacks.values()].every((stack) => stack.length === 0);
  }

  function splitParts(expression: string) {
    const parts: string[] = [];
    let part = "";
    for (const char of Array.from(expression)) {
      const closed = isParenthesisClosed(part);
      if (closed && char === ",") {
        parts.push(part);
        part = "";
      } else {
        part += char;
      }
    }
    parts.push(part);
    return parts;
  }

  function parseVariableAssignments(
    statement: string,
  ): ScriptSegment[] | undefined {
    const processed = preProcessor(statement);
    const assignments: ScriptSegment[] = [];
    const variableNames = splitParts(processed.split("=")[0]).map((s) =>
      s.trim(),
    );
    const variableValues = splitParts(processed.split("=")[1]).map((s) =>
      s.trim(),
    );

    if (variableNames.length !== variableValues.length) {
      throw new Error("Error parsing variables: mismatched names and values!");
    }

    for (let i = 0; i < variableNames.length; i++) {
      assignments.push({
        name: variableNames[i],
        value: variableValues[i],
      });
    }

    assignments.forEach((e) => {
      e.value = GridScript.humanize(e.value);
    });

    return assignments;
  }

  function buildScript(segments: ScriptSegment[]) {
    const variables = segments.map((segment) => segment.name).join(",");
    const values = segments.map((segment) => segment.value).join(",");
    const processed = postProcessor(`${variables}=${values}`);
    return GridScript.shortify(processed);
  }

  function handleInput() {
    const script = buildScript(segments);
    let parsingError = false;
    try {
      parseVariableAssignments(script);
    } catch (e) {
      parsingError = true;
    }

    dispatch("input", {
      value: script,
      validationError:
        validators.some((e) => e.value === false) || parsingError,
    });
  }

  function handleChange() {
    const script = buildScript(segments);
    dispatch("change", { value: script });
  }

  function addVariable() {
    segments = [...segments, { name: "", value: "" }];
    validators = [
      ...validators,
      {
        value: false,
        func: (e) => new Validator(e).isLuaVariable().Result(),
      },
    ];
  }

  function removeVariable(index: number) {
    segments = segments.filter((e, i) => i !== index);
    validators = validators.filter((e, i) => i !== index);
    handleInput();
    handleChange();
  }
</script>

<container>
  <div class="flex flex-col gap-2">
    {#each segments as segment, i (segment)}
      <div class="grid grid-cols-[25%_1fr_auto] gap-2 items-center">
        <div data-testid="variable-name">
          <MeltCombo
            title=" "
            value={segment.name}
            validator={validators[i].func}
            on:input={(e) => {
              const { value, validationError } = e.detail;
              segment.name = value;
              validators[i].value = !validationError;
              handleInput();
            }}
            on:change={handleChange}
          />
        </div>

        <div
          data-testid="variable-value"
          class="border border-black flex items-center flex-grow h-full"
        >
          <LineEditor
            on:input={(e) => {
              segment.value = e.detail.script ?? "";
              handleInput();
            }}
            on:change={handleChange}
            {restrictScopeTo}
            value={segment.value}
            {availableCharacters}
          />
        </div>

        <button
          class:invisible={segments.length === 1}
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
    <div data-testid="add-variable" class="self-center">
      <MoltenPushButton click={addVariable} text={`Add New Variable`} />
    </div>
  </div>
</container>
