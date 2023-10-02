<script context="module">
  // Component for the untoggled "header" of the component
  import ForLoopHeader from "./headers/ForLoopHeader.svelte";
  export const header = ForLoopHeader;

  // config descriptor parameters
  export const information = {
    short: "for",
    name: "For_Loop",
    rendering: "modifier",
    rounding: "top",
    category: "loop",
    desc: "Repeater Loop",
    blockTitle: "Repeater Loop",
    defaultLua: "for i = 10,1,-1 do --[[@enl]] end",
    icon: `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="3.32 5.32 17.37 16.37"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8 18H7C5.34315 18 4 16.6569 4 15V9C4 7.34315 5.34315 6 7 6H17C18.6569 6 20 7.34315 20 9V15C20 16.6569 18.6569 18 17 18H12M12 18L15 15M12 18L15 21" stroke="#000000" stroke-width="1.3679999999999999" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`,
    blockIcon: `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="3.32 5.32 17.37 16.37"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8 18H7C5.34315 18 4 16.6569 4 15V9C4 7.34315 5.34315 6 7 6H17C18.6569 6 20 7.34315 20 9V15C20 16.6569 18.6569 18 17 18H12M12 18L15 15M12 18L15 21" stroke="#000000" stroke-width="1.3679999999999999" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`,
    color: "#F4511E",
    selectable: true,
    movable: true,
    hideIcon: true,
    type: "composite_open",
    toggleable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import stringManipulation from "../main/user-interface/_string-operations";
  import { Validator } from "./_validators";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";
  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";
  import SendFeedback from "../main/user-interface/SendFeedback.svelte";
  import { localDefinitions } from "../runtime/runtime.store";
  import { onMount } from "svelte";
  import { Script } from "./_script_parsers.js";

  export let config = "";
  export let index;

  export let access_tree;

  import { windowSize } from "../runtime/window-size";

  let showSuggestions = false;
  let focusedInput = undefined;
  let focusGroup = [];

  const dispatch = createEventDispatcher();

  let data = [
    {
      value: "i",
      label: "Variable",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
    {
      value: "1",
      label: "Initial value",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
    {
      value: "10",
      label: "End value",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
    {
      value: "1",
      label: "Increment",
      validator: (e) => {
        return new Validator(e).NotEmpty().Result();
      },
      suggestions: [],
    },
  ];

  $: console.log(config);

  $: loadScript({ script: config.script, short: config.short });

  function loadScript({ script, short }) {
    let segments = Script.toSegments({ script, short });
    if (segments.length !== 4) {
      throw "For loop has missing parameter";
    }
    for (let i = 0; i < 4; ++i) {
      data[i].value = String(segments[i]);
    }
  }

  function sendData() {
    const shortData = data.map((e) => stringManipulation.shortify(e.value));
    const segments = [shortData[0] + "=" + shortData[1], ...shortData.slice(2)];
    dispatch("output", {
      short: information.short,
      script: `for ${segments.join(",")} do`,
    });
  }

  function handleClick(e) {
    dispatch("toggle");
  }

  function onActiveFocus(event, index) {
    focusGroup[index] = event.detail.focus;
    focusedInput = index;
    console.log($localDefinitions);
  }

  function onLooseFocus(event, index) {
    focusGroup[index] = event.detail.focus;
    //showSuggestions = focusGroup.includes(true);
  }

  /*
  $: if (scriptSegments[0] || $localDefinitions) {
    //renderSuggestions();
    suggestions = suggestions.map((s) => [...$localDefinitions, ...s]);
    console.log(suggestions, $localDefinitions);
  }*/
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<for-loop-block class="{$$props.class} py-2">
  <div class="flex flex-row items-center">
    <div class="flex flex-col">
      <div class="flex flex-row mr-4 items-center gap-2">
        <div class="grid grid-cols-4 gap-x-2 gap-y-1">
          {#each data as obj}
            <div class="text-white text-sm h-full truncate">
              {obj.label}
            </div>
          {/each}
          {#each data as obj, i}
            <AtomicInput
              class="flex h-7"
              bind:inputValue={obj.value}
              suggestions={obj.suggestions}
              validator={obj.validator}
              on:validator={(e) => {
                const data = e.detail;
                dispatch("validator", data);
              }}
              on:active-focus={(e) => {
                onActiveFocus(e, i);
              }}
              on:loose-focus={(e) => {
                onLooseFocus(e, i);
              }}
              on:change={sendData}
            />
          {/each}
        </div>
      </div>
      <!-- {#if showSuggestions}
        <AtomicSuggestions
          {suggestions}
          {focusedInput}
          on:select={(e) => {
            //scriptSegments[e.detail.index] = e.detail.value;
            //sendData(e.detail.value, e.detail.index);
          }}
        />
      {/if} -->

      <SendFeedback
        feedback_context="Midi"
        class="mt-2 text-sm text-gray-700"
      />
    </div>
    <div
      class="ml-auto min-w-[10px] h-full opacity-50 mr-1 rotate-180 origin-center cursor-pointer"
      on:click={handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 4 18 10"
        class="fill-black"
        ><g stroke-width="0" /><g
          stroke-linecap="round"
          stroke-linejoin="round"
        /><g id="SVGRepo_iconCarrier">
          <path
            d="M17.707 5.707l-8 8a1 1 0 0 1-1.414 0l-8-8A1 1 0 0 1 1 4h16a1 1 0 0 1 .924.617A.97.97 0 0 1 18 5a1 1 0 0 1-.293.707z"
          />
        </g></svg
      >
    </div>
  </div>
</for-loop-block>
