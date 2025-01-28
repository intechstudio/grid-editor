<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { parenthesis, Validator } from "../_validators.js";
  import SendFeedback from "../../main/user-interface/SendFeedback.svelte";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { MeltCombo, MoltenPushButton } from "@intechstudio/grid-uikit";
  import { ActionData, GridAction } from "../../runtime/runtime.js";
  import { Grid } from "../../lib/_utils.js";
  import { stringify } from "querystring";
  import { ActionBlockInformation } from "../ActionBlockInformation.js";

  type ScriptSegment = Grid.VariableBlock.ScriptSegment;

  export let config: GridAction;
  export let parseScript: (script: string) => ScriptSegment[];
  export let buildScript: (segments: ScriptSegment[]) => string;

  const dispatch = createEventDispatcher();
  let errorText = "";
  let segments: ScriptSegment[] = [];

  $: {
    segments = parseScript($config.script);
    for (const segment of segments) {
      segment.value = GridScript.humanize(segment.value);
    }
    updateErrorText();
  }

  function updateErrorText() {
    errorText = Grid.VariableBlock.getError(segments).text;
  }

  function sendData() {
    const script = buildScript(segments);
    updateErrorText();
    dispatch("update-action", {
      short: config.information.short,
      script: GridScript.shortify(script),
    });
  }

  function addVariable() {
    segments.push({ variable: "", value: "" });
    sendData();
  }

  function removeVariable(i: number) {
    segments.splice(i, 1);
    sendData();
  }
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <div class="flex flex-col">
      <span class="text-white text-sm"
        >{config.information.displayName} Variables:</span
      >
      <span class="text-sm text-error" class:hidden={errorText === "OK"}
        >Error: {errorText}</span
      >
    </div>

    <div class="flex flex-col gap-2">
      {#each segments as segment, i}
        <div class="grid grid-cols-[25%_1fr_auto] gap-2 items-center">
          <div data-testid="variable-name">
            <MeltCombo
              title={" "}
              bind:value={segment.variable}
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
              action={config}
              value={segment.value}
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
    </div>

    <div data-testid="add-variable" class="self-center">
      <MoltenPushButton
        click={addVariable}
        text={`Add New ${config.information.displayName} Variable`}
      />
    </div>

    <SendFeedback
      feedback_context={`${config.information.displayName}s`}
      class="text-sm text-gray-500"
    />
  </div>
</container>
