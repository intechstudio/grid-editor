<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information = {
    short: "spc",
    name: "SettingsPotmeter",
    rendering: "standard",
    category: "element settings",
    color: "#5F416D",
    desc: "Potmeter Mode",
    blockTitle: "Potmeter Mode",
    defaultLua: "self:pmo(7) self:pma(127)",
    icon: `<span class="block w-full text-center italic font-gt-pressura">PC</span>`,
    blockIcon: `<span class="block w-full text-center italic font-gt-pressura">PC</span>`,
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

  let pmo = ""; // local script part
  let pma = "";

  const whatsInParenthesis = /\(([^)]+)\)/;

  let loaded = false;

  $: if (config.script && !loaded) {
    const arr = config.script.split("self:").slice(1);

    pmo = whatsInParenthesis.exec(arr[0])[1];
    //pmo = pmo[1];
    pma = whatsInParenthesis.exec(arr[1])[1];
    //pma = pma[1];

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  $: if (pmo || pma) {
    sendData(pmo, pma);
  }

  function sendData(p1, p2) {
    dispatch("output", {
      short: "spc",
      script: `self:pmo(${p1}) self:pma(${p2})`,
    });
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
      { value: "7", info: "7 bit (default)" },
      { value: "8", info: "8 bit" },
      { value: "9", info: "9 bit" },
      { value: "10", info: "10 bit" },
      { value: "11", info: "11 bit (not recommended)" },
      { value: "12", info: "12 bit (not recommended)" },
    ],

    [
      { value: "127", info: "7 bit MIDI (default)" },
      { value: "16383", info: "14 bit MIDI (high res)" },
    ],
  ];

  let suggestionElement = undefined;

  let focusedInputIndex = null;
  function handleInputFocus(index) {
    focusedInputIndex = index;
  }

  function handleSuggestionSelected(e) {
    const { value } = e.detail;
    scriptSegments[focusedInputIndex] = value;
    sendData(value, focusedInputIndex);
  }
</script>

<potmeter-settings
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <div class="w-full flex">
    <div class="w-1/2 flex flex-col">
      <div class="w-full px-2">
        <div class="text-gray-500 text-sm pb-1">Bit depth</div>
        <AtomicInput
          inputValue={pmo}
          suggestions={suggestions[0]}
          validator={(e) => {
            return new Validator(e).NotEmpty().Result();
          }}
          on:focus={() => handleInputFocus()}
          on:change={(e) => {
            pmo = e.detail;
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
        <div class="text-gray-500 text-sm pb-1">Max Value</div>
        <AtomicInput
          inputValue={pma}
          suggestions={suggestions[1]}
          validator={(e) => {
            return new Validator(e).NotEmpty().Result();
          }}
          suggestionTarget={suggestionElement}
          on:focus={() => handleInputFocus()}
          on:change={(e) => {
            pma = e.detail;
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
    on:select={(e) => {
      if (focusedInput == 1) {
        pma = e.detail.value;
      }
      if (focusedInput == 0) {
        pmo = e.detail.value;
      }
    }}
  />
</potmeter-settings>
