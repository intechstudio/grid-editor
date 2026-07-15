<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "l",
    name: "VarLocals",
    rendering: "standard",
    category: "variables",
    displayName: "Locals",
    description: "Define variables for this event",
    defaultLua: "local num = self:ind()",
    color: categoryColors["variables"] as any,
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 4.2c-1.9 0-2.6 1-2.6 2.4v2.5c0 1.1-.6 1.8-1.9 1.9v2c1.3.1 1.9.8 1.9 1.9v2.5c0 1.4.7 2.4 2.6 2.4M14.5 4.2c1.9 0 2.6 1 2.6 2.4v2.5c0 1.1.6 1.8 1.9 1.9v2c-1.3.1-1.9.8-1.9 1.9v2.5c0 1.4-.7 2.4-2.6 2.4"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 4.2c-1.9 0-2.6 1-2.6 2.4v2.5c0 1.1-.6 1.8-1.9 1.9v2c1.3.1 1.9.8 1.9 1.9v2.5c0 1.4.7 2.4 2.6 2.4M14.5 4.2c1.9 0 2.6 1 2.6 2.4v2.5c0 1.1.6 1.8 1.9 1.9v2c-1.3.1-1.9.8-1.9 1.9v2.5c0 1.4-.7 2.4-2.6 2.4"/></svg>`,
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
  import { ActionData, GridAction, GridEvent } from "../runtime/runtime.js";
  import VariableManager from "./components/VariableManager.svelte";
  import { ElementType } from "@intechstudio/grid-protocol";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  let event = action.parent as GridEvent;
  let script: string;

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  function handleActionChange(data: ActionData) {
    script = data.script;
  }

  function handleUpdateAction(e: any) {
    const { value, validationError } = e.detail;
    dispatch("update-action", {
      short: action.information.short,
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

  let elementType = $event.getInfo().element.type as ElementType;
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
