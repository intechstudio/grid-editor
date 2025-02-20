<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "c",
    name: "Comment",
    rendering: "standard",
    category: "code",
    displayName: "Comment Block",
    defaultLua: "--[[This Is A Comment]]",
    icon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">--</span>
    `,
    blockIcon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">--</span>
    `,
    color: "#887880",
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { MeltCombo } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./_validators";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let scriptValue = ""; // local script part

  $: handleConfigChange($config);

  function handleConfigChange(config) {
    if (!config.checkSyntax()) {
      return;
    }

    scriptValue = config.script.split("--[[")[1].split("]]")[0];
  }

  function sendData(e) {
    dispatch("update-action", { short: "c", script: `--[[${e}]]` });
  }

  const validator = (e) => {
    return new Validator(e).Result();
  };
</script>

<element-name class="flex flex-col w-full p-2 pointer-events-auto">
  <MeltCombo
    title={"Comment"}
    bind:value={scriptValue}
    {validator}
    on:validator={(e) => {
      const data = e.detail;
      dispatch("validator", data);
    }}
    on:input={(e) => {
      sendData(e.detail);
    }}
    on:change={() => dispatch("sync")}
    postProcessor={GridScript.shortify}
    preProcessor={GridScript.humanize}
  />
</element-name>
