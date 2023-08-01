<script context="module">
  // config descriptor parameters
  export const information = {
    short: "sbc",
    name: "SettingsButton",
    rendering: "standard",
    category: "element settings",
    desc: "Button Mode",
    color: "#5F416D",
    defaultLua: "self:bmo(0)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">BC</span>`,
    selectable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";
  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";
  import { Validator } from "./_validators";

  export let config = "";
  export let index;

  const dispatch = createEventDispatcher();

  let scriptValue = ""; // local script part

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    let param1 = whatsInParenthesis.exec(config.script);

    if (param1 !== null) {
      if (param1.length > 0) {
        scriptValue = param1[1];
      }
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: if (scriptValue) {
    sendData(scriptValue);
  }

  function sendData(e) {
    dispatch("output", { short: `sbc`, script: `self:bmo(${e})` });
  }

  let showSuggestions = false;
  let focusedInput = undefined;
  let focusGroup = [];

  function onActiveFocus(event, index) {
    focusGroup[index] = event.detail.focus;
    focusedInput = index;
  }

  function onLooseFocus(event, index) {
    focusGroup[index] = event.detail.focus;
    showSuggestions = focusGroup.includes(true);
  }

  const suggestions = [
    [
      { value: "0", info: "Momentary" },
      { value: "1", info: "Toggle" },
      { value: "2", info: "2-step" },
      { value: "3", info: "3-step" },
    ],
  ];
</script>

<encoder-settings class="flex flex-col w-full p-2">
  <div class="w-full px-2">
    <div class="text-gray-500 text-sm pb-1">Button Mode</div>
    <AtomicInput
      suggestions={suggestions[0]}
      on:change={(e) => {
        scriptValue = e.detail;
      }}
      validator={(e) => {
        return new Validator(e).NotEmpty().Result();
      }}
      on:validator={(e) => {
        const data = e.detail;
        dispatch("validator", data);
      }}
      on:active-focus={(e) => {
        onActiveFocus(e, 0);
      }}
      on:loose-focus={(e) => {
        onLooseFocus(e, 0);
      }}
    />
  </div>

  {#if focusGroup[0]}
    <AtomicSuggestions
      {suggestions}
      on:select={(e) => {
        scriptValue = e.detail.value;
      }}
    />
  {/if}
</encoder-settings>
