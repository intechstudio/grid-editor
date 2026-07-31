<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  export const information: ActionBlockInformation = {
    short: "g",
    name: "VarGlobal",
    rendering: "standard",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/variables/global-variables",
    category: "variables",
    displayName: "Global",
    description: "Define variables shared by the module",
    defaultLua: "test = self:ind()",
    color: categoryColors["variables"] as any,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.9 2.8 2.9 14.2 0 17-2.9-2.8-2.9-14.2 0-17Z"/></svg>`,
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

  const dispatch = createEventDispatcher();

  export let action: GridAction;

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

  let elementType = event.getInfo().element.type as ElementType;
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <span class="text-sm">Global Variables:</span>

    <VariableManager
      {script}
      preProcessor={(script) => script}
      postProcessor={(script) => script}
      availableCharacters={$event.getAvailableChars()}
      restrictScopeTo={elementType}
      on:input={handleUpdateAction}
      on:change={() => dispatch("sync")}
    />
  </div>
</container>
