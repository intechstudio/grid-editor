<script lang="ts" module>
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
    hiddenInMinimalist: true,
  };
</script>

<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher } from "svelte";
  import { GridAction, GridEvent } from "../runtime/runtime.js";
  import VariableManager from "./components/VariableManager.svelte";

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  const dispatch = createEventDispatcher();

  let event = config.parent as GridEvent;
  let script: string = $state();


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

  let elementType = config.parent.getInfo().element.type;
  run(() => {
    if (!$config.invalid) {
      handleConfigChange($config);
    }
  });
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
