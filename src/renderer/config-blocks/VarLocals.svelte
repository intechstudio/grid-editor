<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "l",
    name: "VarLocals",
    rendering: "standard",
    category: "variables",
    displayName: "Locals",
    defaultLua: "local num = self:ind()",
    color: "#78BC61",
    icon: `<span class="block w-full text-black text-center italic font-gt-pressura">L</span>`,
    blockIcon: `<span class="block w-full text-black text-center italic font-gt-pressura">L</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { parenthesis, Validator } from "./_validators.js";
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
  import LineEditor from "../main/user-interface/LineEditor.svelte";
  import { MeltCombo, MoltenPushButton } from "@intechstudio/grid-uikit";
  import { ActionData, GridAction } from "../runtime/runtime.js";
  import { Grid } from "../lib/_utils.js";

  export let config: GridAction;

  const dispatch = createEventDispatcher();

  type ScriptSegment = Grid.VariableBlock.ScriptSegment;

  let scriptSegments: ScriptSegment[];
  let errorText = "";

  $: handleConfigChange($config);

  function handleConfigChange(config: ActionData) {
    // this works differently from normal _utils...
    scriptSegments = localsToConfig(config.script);
    updateErrorText();
  }

  function updateErrorText() {
    errorText = Grid.VariableBlock.getError(scriptSegments).text;
  }

  function addLocalVariable() {
    scriptSegments.push({ variable: "", value: "" });
    sendData();
  }

  function removeLocalVariable(i: number) {
    scriptSegments.splice(i, 1);
    sendData();
  }

  function humanizeLocals(segments: ScriptSegment[]): ScriptSegment[] {
    return segments.map((elem) => {
      elem.value = GridScript.humanize(elem.value);
      return elem;
    });
  }

  function sendData() {
    const script = localArrayToScript(scriptSegments);
    updateErrorText();
    dispatch("update-action", {
      short: "l",
      script: GridScript.shortify(script),
    });
  }

  function localArrayToScript(arr: ScriptSegment[]): string {
    let script = [
      "local ",
      arr.map((e) => e.variable).join(","),
      "=",
      arr.map((e) => e.value).join(","),
    ].join("");
    return script;
  }

  function localsToConfig(script: string): ScriptSegment[] {
    if (parenthesis(script)) {
      // this had to be moved out of locals function, as array refresh was killed by $ with scriptSegments..
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

      const _variable_array = script.split("=")[0].split("local")[1].split(",");

      let arr: ScriptSegment[] = [];

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
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <div class="flex flex-col">
      <span class="text-white text-sm">Local Variables:</span>
      <span class="text-sm text-error" class:hidden={errorText === "OK"}
        >Error: {errorText}</span
      >
    </div>

    <div class="flex flex-col gap-2">
      {#each scriptSegments as script, i}
        <div class="grid grid-cols-[25%_1fr_auto] gap-2 items-center">
          <MeltCombo
            title={" "}
            bind:value={script.variable}
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

          <div class="border border-black flex items-center flex-grow h-full">
            <LineEditor
              on:input={(e) => {
                script.value = e.detail.script ?? "";
                sendData();
              }}
              on:change={() => dispatch("sync")}
              action={config}
              value={script.value}
            />
          </div>

          <button
            class:invisible={i === 0}
            on:click={() => {
              removeLocalVariable(i);
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

    <div class="self-center">
      <MoltenPushButton
        click={addLocalVariable}
        text={"Add New Local Variable"}
      />
    </div>

    <SendFeedback feedback_context="Locals" class="text-sm text-gray-500" />
  </div>
</container>
