<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "c",
    name: "Comment",
    rendering: "standard",
    category: "code",
    displayName: "Comment Block",
    description: "Leave a note for yourself",
    documentationUrl: "https://docs.intech.studio/wiki/actions/code/comment",
    defaultLua: "--[[This Is A Comment]]",
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H9.4L4 21V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z"/><path d="M9 11h6"/></svg>`,
    color: categoryColors["code"] as any,
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
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./validators";
  import { ActionData, GridAction } from "../runtime/runtime.js";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let scriptValue = ""; // local script part

  const validator = {
    value: true,
    func: (e: string) => {
      return new Validator(e).NotEmpty().Result();
    },
  };

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    scriptValue = data.script.split("--[[")[1].split("]]")[0];
  }

  function sendData(e) {
    dispatch("update-action", {
      short: "c",
      script: `--[[${e}]]`,
      validationError: validator.value === false,
    });
  }
</script>

<element-name class="flex flex-col w-full p-2 pointer-events-auto">
  <MeltCombo
    title={"Comment"}
    value={scriptValue}
    validator={validator.func}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      scriptValue = value;
      validator.value = !validationError;
      dispatch("validation", { value: validationError });
      sendData(value);
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />
</element-name>
