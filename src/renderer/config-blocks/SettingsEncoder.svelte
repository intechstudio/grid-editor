<script context="module">
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
  };
</script>

<script>
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
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
</script>

<encoder-settings class="flex flex-col w-full p-2">
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
          on:change={(e) => {
            emo = e.detail;
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
          on:change={(e) => {
            ev0 = e.detail;
          }}
          on:validator={(e) => {
            const data = e.detail;
            dispatch("validator", data);
          }}
          on:active-focus={(e) => {
            onActiveFocus(e, 1);
          }}
          on:loose-focus={(e) => {
            onLooseFocus(e, 1);
          }}
        />
      </div>
    </div>
  </div>

  {#if showSuggestions}
    <AtomicSuggestions
      {suggestions}
      {focusedInput}
      on:select={(e) => {
        if (focusedInput == 1) {
          ev0 = e.detail.value;
        }
        if (focusedInput == 0) {
          emo = e.detail.value;
        }
      }}
    />
  {/if}
</encoder-settings>
