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
  import { GridAction, GridEvent } from "../runtime/runtime.js";
  import VariableManager from "./components/VariableManager.svelte";
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  let event = config.parent as GridEvent;

  function handleUpdateAction(e: any) {
    const { value } = e.detail;
    dispatch("update-action", {
      short: config.information.short,
      script: value,
    });
  }

  function preProcessor(script: string): string {
    // Matches "local " only at the start of the string
    return script.replace(/^local\s+/, "");
  }

  function postProcessor(script: string): string {
    return `local ${script}`;
  }
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <span class="text-white text-sm">Local Variables:</span>

    <VariableManager
      script={config.script}
      {preProcessor}
      {postProcessor}
      availableCharacters={$event.getAvailableChars()}
      on:input={handleUpdateAction}
      on:change={() => dispatch("sync")}
    />

    <SendFeedback feedback_context={`Locals`} class="text-sm text-gray-500" />
  </div>
</container>
