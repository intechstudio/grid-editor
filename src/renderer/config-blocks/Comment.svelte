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
  import { AtomicInput } from "@intechstudio/grid-uikit";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { Validator } from "./_validators";

  export let config;
  export let index;

  const dispatch = createEventDispatcher();

  let loaded = false;

  let scriptValue = ""; // local script part

  $: if (config.script && !loaded) {
    scriptValue = config.script.split("--[[")[1].split("]]")[0];
    loaded = true;
  }

  $: if (scriptValue && loaded) {
    sendData(scriptValue);
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e) {
    dispatch("output", { short: "c", script: `--[[${e}]]` });
  }

  const validator = (e) => {
    return new Validator(e).Result();
  };
</script>

<element-name
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Comment</div>

    <AtomicInput
      value={GridScript.humanize(scriptValue)}
      {validator}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:change={(e) => {
        let newValue = e.detail;
        sendData(GridScript.shortify(newValue));
      }}
    />
  </div>
</element-name>
