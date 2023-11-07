<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information = {
    short: "c",
    name: "Comment",
    rendering: "standard",
    toggleable: false,
    category: "code",
    desc: "Comment Block",
    blockTitle: "Comment Block",
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
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";
  import { Validator } from "./_validators";

  export let config = "";
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
      inputValue={scriptValue}
      {validator}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:change={(e) => {
        let newValue = e.detail;
        sendData(newValue);
      }}
    />
  </div>
</element-name>
