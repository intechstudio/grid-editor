<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  import { categoryColors } from "./categoryColors";
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
    color: categoryColors["variables"] as any,
    icon: `<span class="block w-full text-black text-center italic font-gt-pressura">S</span>`,
    blockIcon: `<span class="block w-full text-black text-center italic font-gt-pressura">S</span>`,
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
    const split = script.split("=");
    const leftSide = split[0].replaceAll("self.", "");
    const rightSide = split.slice(1, split.length).join("");
    return `${leftSide}=${rightSide}`;
  }
  function postProcessor(script: string): string {
    const split = script.split("=");
    const leftSide = split[0].split(",").map((e) => `self.${e.trim()}`);
    const rightSide = split.slice(1, split.length).join("").trim();
    return `${leftSide}=${rightSide}`;
  }

  let elementType = $event.getInfo().element.type;
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <span class="text-sm">Self Variables:</span>

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
