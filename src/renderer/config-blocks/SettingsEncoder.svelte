<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information = {
    short: "sec",
    name: "SettingsEncoder",
    rendering: "standard",
    category: "element settings",
    color: "#5F416D",
    desc: "Encoder Mode",
    blockTitle: "Encoder Mode",
    defaultLua: "self:emo(0) self:ev0(50)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">EC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">EC</span>`,
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
  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";
  import { Validator } from "./_validators";

  export let config = "";
  export let index;

  const dispatch = createEventDispatcher();

  let emo = ""; // local script part
  let ev0 = "";

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    let param1 = whatsInParenthesis.exec(arr[0]);

    if (param1 !== null) {
      if (param1.length > 0) {
        emo = param1[1];
      }
    }

    let param2 = whatsInParenthesis.exec(arr[1]);

    if (param2 !== null) {
      if (param2.length > 0) {
        ev0 = param2[1];
      }
    }

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: if (emo || ev0) {
    sendData(emo, ev0);
  }

  function sendData(p1, p2) {
    dispatch("output", {
      short: `sec`,
      script: `self:emo(${p1}) self:ev0(${p2})`,
    });
  }

  const suggestions = [
    [
      { value: "0", info: "Absolute" },
      { value: "1", info: "Relative BinOffset" },
      { value: "2", info: "Relative 2's Comp" },
    ],

    [
      { value: "0", info: "No velocity (0%)" },
      { value: "50", info: "Default (50%)" },
      { value: "100", info: "Maximum (100%)" },
    ],
  ];

  let suggestionElement = undefined;

  let focusedInputIndex = null;
  function handleInputFocus(index) {
    focusedInputIndex = index;
  }

  function handleSuggestionSelected(e) {
    const { value } = e.detail;
    if (focusedInputIndex == 1) {
      ev0 = value;
    }
    if (focusedInputIndex == 0) {
      emo = value;
    }
  }
</script>

<encoder-settings
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <div class="w-full flex">
    <div class="w-1/2 flex flex-col">
      <div class="w-full px-2">
        <div class="text-gray-500 text-sm pb-1 truncate">Encoder Mode</div>
        <AtomicInput
          inputValue={emo}
          suggestions={suggestions[0]}
          validator={(e) => {
            return new Validator(e).NotEmpty().Result();
          }}
          suggestionTarget={suggestionElement}
          on:focus={() => handleInputFocus(0)}
          on:change={(e) => {
            emo = e.detail;
          }}
          on:validator={(e) => {
            const data = e.detail;
            dispatch("validator", data);
          }}
        />
      </div>
    </div>

    <div class="w-1/2 flex flex-col">
      <div class="w-full px-2">
        <div class="text-gray-500 text-sm pb-1 truncate">Encoder Velocity</div>
        <AtomicInput
          inputValue={ev0}
          suggestions={suggestions[1]}
          validator={(e) => {
            return new Validator(e).NotEmpty().Result();
          }}
          suggestionTarget={suggestionElement}
          on:focus={() => handleInputFocus(1)}
          on:change={(e) => {
            ev0 = e.detail;
          }}
          on:validator={(e) => {
            const data = e.detail;
            dispatch("validator", data);
          }}
        />
      </div>
    </div>
  </div>

  <AtomicSuggestions
    bind:component={suggestionElement}
    on:select={handleSuggestionSelected}
  />
</encoder-settings>
