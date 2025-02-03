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
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";

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
</script>

<container>
  <div class="flex flex-col gap-2 w-full px-2 py-4 pointer-events-auto">
    <span class="text-white text-sm">Self Variables:</span>

    <VariableManager
      script={config.script}
      {preProcessor}
      {postProcessor}
      availableCharacters={$event.getAvailableChars()}
      on:script={handleUpdateAction}
    />

    <SendFeedback feedback_context={`Selfs`} class="text-sm text-gray-500" />
  </div>
</container>
