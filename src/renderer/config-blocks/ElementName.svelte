<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation.ts";
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "sn",
    name: "ElementName",
    rendering: "standard",
    category: "code",
    displayName: "Element Name",
    defaultLua: `self:gen("Custom Name")`,
    icon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">N</span>
    `,
    blockIcon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">N</span>
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

    const matches = config.script.match(/self:gen\("([^"]*)"\)/);
    scriptValue = matches[1];
  }

  $: {
    sendData(scriptValue);
  }

  function sendData(e) {
    dispatch("update-action", { short: "sn", script: `self:gen("${e}")` });
  }

  const validator = (e) => {
    return new Validator(e).Result();
  };
</script>

<element-name
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <MeltCombo
    title={"Element Name"}
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
