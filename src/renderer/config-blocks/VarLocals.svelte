<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "l",
    name: "VarLocal",
    rendering: "standard",
    category: "variables",
    displayName: "Local",
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
    return script.replace("local ", "");
  }

  function postProcessor(script: string): string {
    return `local ${script}`;
  }
</script>

<container>
  <VariableManager
    script={config.script}
    {preProcessor}
    {postProcessor}
    type={"Locale"}
    availableCharacters={$event.getAvailableChars()}
    on:script={handleUpdateAction}
  />
</container>
