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
  import { GridAction, GridEvent } from "../runtime/runtime.js";
  import VariableManager from "./components/VariableManager.svelte";

  export let config: GridAction;

  const dispatch = createEventDispatcher();

  let event = config.parent as GridEvent;
  let script: string;

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config) {
    script = config.script;
  }

  function handleUpdateAction(e: any) {
    const { value, validationError } = e.detail;
    dispatch("update-action", {
      short: config.information.short,
      script: value,
      validationError: validationError,
    });
  }

  function preProcessor(script: string): string {
    // Matches "local " only at the start of the string
    return script.replace(/^local\s+/, "");
  }
  function postProcessor(script: string): string {
    return `local ${script}`;
  }

  let elementType = config.parent.getInfo().element.type;
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <span class="text-sm">Local Variables:</span>
    <VariableManager
      {script}
      {preProcessor}
      {postProcessor}
      availableCharacters={$event.getAvailableChars()}
      restrictScopeTo={elementType}
      on:input={handleUpdateAction}
      on:change={() => dispatch("sync")}
    />
  </div>
</container>
