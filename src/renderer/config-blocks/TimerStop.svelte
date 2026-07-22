<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "gtp",
    name: "TimerStop",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/timer/timer-stop",
    category: "timer",
    displayName: "Stop",
    description: "Stop this element's timer",
    color: categoryColors["timer"] as any,
    defaultLua: "gtp(self:ind())",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="13" r="8"/><rect x="9.4" y="10.4" width="5.2" height="5.2" rx="0.8"/><path d="M10 2.5h4"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="13" r="8"/><rect x="9.4" y="10.4" width="5.2" height="5.2" rx="0.8"/><path d="M10 2.5h4"/></svg>`,
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
  import { LocalDefinitions } from "../runtime/runtime.store";
  import { Validator } from "./validators";
  import { ActionData, GridAction, GridEvent } from "./../runtime/runtime";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  const validator = {
    value: true,
    func: (e: string) => {
      return new Validator(e).isLuaValue().Result();
    },
  };

  let event = action.parent as GridEvent;

  const whatsInParenthesis = /gtp\(([^"]*)\)/;
  let scriptValue = "";

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    let param1 = whatsInParenthesis.exec(data.script);
    if (param1 !== null) {
      if (param1.length > 0) {
        scriptValue = param1[1];
      }
    }
  }

  $: if (scriptValue) {
    sendData(scriptValue);
  }

  function sendData(e) {
    dispatch("update-action", {
      short: "gtp",
      script: `gtp(${e})`,
      validationError: validator.value === false,
    });
  }

  let suggestions = [];

  const _suggestions = [[]];

  $: {
    const actions = $event.config;
    const index = actions.findIndex((e) => e.id === action.id);
    const localDefinitions = LocalDefinitions.getFrom({
      configs: actions,
      index: index,
    });
    suggestions = _suggestions.map((s, i) => {
      // SKIP LAYER
      return [...s, ...localDefinitions];
    });
  }
</script>

<timer-stop class="flex flex-col w-full p-2 pointer-events-auto">
  <MeltCombo
    title={"Element Number"}
    value={scriptValue}
    suggestions={suggestions[0]}
    on:input={(e) => {
      const { value, validationError } = e.detail;
      scriptValue = value;
      validator.value = !validationError;
      dispatch("validation", { value: validationError });
      scriptValue = value;
    }}
    on:change={() => dispatch("sync")}
    validator={validator.func}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />
</timer-stop>
