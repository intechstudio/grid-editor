<script context="module">
  // config descriptor parameters
  export const information = {
    short: "sn",
    name: "ElementName",
    rendering: "standard", //'hidden'
    toggleable: false,
    category: "code",
    desc: "Element Name",
    defaultLua: "self.sn=''",
    icon: `
    <span class="block w-full text-black text-center italic font-gt-pressura">N</span>
    `,
    color: "#887880",
  };
</script>

<script>
  import { onMount, createEventDispatcher, onDestroy } from "svelte";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";
  import { parenthesis } from "./_validators";

  import TooltipQuestion from "../main/user-interface/tooltip/TooltipQuestion.svelte";

  export let config = "";
  export let index;

  const dispatch = createEventDispatcher();

  let loaded = false;

  let scriptValue = ""; // local script part

  $: if (config.script && !loaded) {
    scriptValue = config.script.trim().slice(10, -2);
    loaded = true;
  }

  $: if (scriptValue !== undefined && loaded) {
    sendData(scriptValue);
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e) {
    dispatch("output", { short: "sn", script: `self:gen("${e}")` });
  }
</script>

<element-name class="flex flex-col w-full p-2">
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Element Name</div>
    <input
      type="text"
      bind:value={scriptValue}
      class="w-full border bg-secondary border-secondary text-white py-0.5 pl-2 rounded-none"
    />
  </div>
</element-name>
