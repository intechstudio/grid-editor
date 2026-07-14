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
    category: "variables",
    displayName: "Global",
    defaultLua: "test = self:ind()",
    color: categoryColors["variables"] as any,
    icon: `<span class="block w-full text-black text-center italic font-gt-pressura">G</span>`,
    blockIcon: `<span class="block w-full text-black text-center italic font-gt-pressura">G</span>`,
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
