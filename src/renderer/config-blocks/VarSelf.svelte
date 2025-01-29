<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "s",
    name: "VarSelf",
    rendering: "standard",
    category: "variables",
    displayName: "Self",
    defaultLua: "self.num = 0",
    color: "#78BC61",
    icon: `<span class="block w-full text-black text-center italic font-gt-pressura">S</span>`,
    blockIcon: `<span class="block w-full text-black text-center italic font-gt-pressura">S</span>`,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction, GridEvent } from "../runtime/runtime.js";
  import VariableManager from "./components/VariableManager.svelte";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  let event = config.parent as GridEvent;

  function handleUpdateAction(e: any) {
    const { script } = e.detail;
    dispatch("update-action", {
      short: config.information.short,
      script: script,
    });
  }

  function preProcessor(script: string): string {
    return script.replace("self.", "");
  }

  function postProcessor(script: string): string {
    return script.replace(
      /(^|,)([^=]*)(=|$)/g,
      (match, separator, variable, equals) => {
        // Trim whitespace from variable names if any
        const trimmedVariable = variable.trim();

        // Add "self." if the variable name is not empty
        const prefixedVariable = trimmedVariable
          ? `self.${trimmedVariable}`
          : "self.";

        return `${separator}${prefixedVariable}${equals}`;
      }
    );
  }
</script>

<container>
  <VariableManager
    script={config.script}
    {preProcessor}
    {postProcessor}
    type={"Global"}
    availableCharacters={$event.getAvailableChars()}
    on:script={handleUpdateAction}
  />
</container>
