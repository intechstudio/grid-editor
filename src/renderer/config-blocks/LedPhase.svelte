<script context="module">
  // config descriptor parameters
  export const information = {
    short: "glp",
    name: "LedPhase",
    rendering: "standard",
    category: "led",
    desc: "Intensity",
    color: "#726E60",
    defaultLua: "glp(,,)",
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 303 303" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M204.8 97.6C191.2 84 172 75.2 151.2 75.2C130.4 75.2 111.2 83.6 97.6 97.6C84 111.2 75.2 130.4 75.2 151.2C75.2 172 84 191.2 97.6 204.8C111.2 218.4 130.4 227.2 151.2 227.2C172 227.2 191.2 218.8 204.8 204.8C218.4 191.2 227.2 172 227.2 151.2C227.2 130.4 218.8 111.2 204.8 97.6ZM190.4 190.4C180.4 200.4 166.4 206.4 151.2 206.4C136 206.4 122 200.4 112 190.4C102 180.4 96 166.4 96 151.2C96 136 102 122 112 112C122 102 136 96 151.2 96C166.4 96 180.4 102 190.4 112C200.4 122 206.4 136 206.4 151.2C206.4 166.4 200.4 180.4 190.4 190.4Z" fill="black"/>
      <path d="M292 140.8H261.2C255.6 140.8 250.8 145.6 250.8 151.2C250.8 156.8 255.6 161.6 261.2 161.6H292C297.6 161.6 302.4 156.8 302.4 151.2C302.4 145.6 297.6 140.8 292 140.8Z" fill="black"/>
      <path d="M151.2 250.8C145.6 250.8 140.8 255.6 140.8 261.2V292C140.8 297.6 145.6 302.4 151.2 302.4C156.8 302.4 161.6 297.6 161.6 292V261.2C161.6 255.6 156.8 250.8 151.2 250.8Z" fill="black"/>
      <path d="M258 243.6L236 221.6C232.4 217.6 225.6 217.6 221.6 221.6C217.6 225.6 217.6 232 221.6 236L243.6 258C247.6 262 254 262 258 258C262 254 262 247.6 258 243.6Z" fill="black"/>
      <path d="M151.2 0C145.6 0 140.8 4.8 140.8 10.4V41.2C140.8 46.8 145.6 51.6 151.2 51.6C156.8 51.6 161.6 46.8 161.6 41.2V10.4C161.6 4.8 156.8 0 151.2 0Z" fill="black"/>
      <path d="M258.4 44.4C254.4 40.4 248 40.4 244 44.4L222 66.4C218 70.4 218 76.8 222 80.8C225.6 84.8 232.4 84.8 236.4 80.8L258.4 58.8C262.4 54.8 262.4 48.4 258.4 44.4Z" fill="black"/>
      <path d="M41.2 140.8H10.4C4.8 140.8 0 145.6 0 151.2C0 156.8 4.4 161.6 10.4 161.6H41.2C46.8 161.6 51.6 156.8 51.6 151.2C51.6 145.6 46.8 140.8 41.2 140.8Z" fill="black"/>
      <path d="M80.4 221.6C76.8 217.6 70 217.6 66 221.6L44 243.6C40 247.6 40 254 44 258C48 262 54.4 262 58.4 258L80.4 236C84.4 232 84.4 225.6 80.4 221.6Z" fill="black"/>
      <path d="M80.4 66.4L58.4 44.4C54.4 40.4 48 40.4 44 44.4C40 48.4 40 54.8 44 58.8L66 80.8C70 84.8 76.4 84.8 80.4 80.8C84.4 76.8 84.4 70.4 80.4 66.4Z" fill="black"/>
    </svg>
    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 303 303" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M204.8 97.6C191.2 84 172 75.2 151.2 75.2C130.4 75.2 111.2 83.6 97.6 97.6C84 111.2 75.2 130.4 75.2 151.2C75.2 172 84 191.2 97.6 204.8C111.2 218.4 130.4 227.2 151.2 227.2C172 227.2 191.2 218.8 204.8 204.8C218.4 191.2 227.2 172 227.2 151.2C227.2 130.4 218.8 111.2 204.8 97.6ZM190.4 190.4C180.4 200.4 166.4 206.4 151.2 206.4C136 206.4 122 200.4 112 190.4C102 180.4 96 166.4 96 151.2C96 136 102 122 112 112C122 102 136 96 151.2 96C166.4 96 180.4 102 190.4 112C200.4 122 206.4 136 206.4 151.2C206.4 166.4 200.4 180.4 190.4 190.4Z" fill="black"/>
      <path d="M292 140.8H261.2C255.6 140.8 250.8 145.6 250.8 151.2C250.8 156.8 255.6 161.6 261.2 161.6H292C297.6 161.6 302.4 156.8 302.4 151.2C302.4 145.6 297.6 140.8 292 140.8Z" fill="black"/>
      <path d="M151.2 250.8C145.6 250.8 140.8 255.6 140.8 261.2V292C140.8 297.6 145.6 302.4 151.2 302.4C156.8 302.4 161.6 297.6 161.6 292V261.2C161.6 255.6 156.8 250.8 151.2 250.8Z" fill="black"/>
      <path d="M258 243.6L236 221.6C232.4 217.6 225.6 217.6 221.6 221.6C217.6 225.6 217.6 232 221.6 236L243.6 258C247.6 262 254 262 258 258C262 254 262 247.6 258 243.6Z" fill="black"/>
      <path d="M151.2 0C145.6 0 140.8 4.8 140.8 10.4V41.2C140.8 46.8 145.6 51.6 151.2 51.6C156.8 51.6 161.6 46.8 161.6 41.2V10.4C161.6 4.8 156.8 0 151.2 0Z" fill="black"/>
      <path d="M258.4 44.4C254.4 40.4 248 40.4 244 44.4L222 66.4C218 70.4 218 76.8 222 80.8C225.6 84.8 232.4 84.8 236.4 80.8L258.4 58.8C262.4 54.8 262.4 48.4 258.4 44.4Z" fill="black"/>
      <path d="M41.2 140.8H10.4C4.8 140.8 0 145.6 0 151.2C0 156.8 4.4 161.6 10.4 161.6H41.2C46.8 161.6 51.6 156.8 51.6 151.2C51.6 145.6 46.8 140.8 41.2 140.8Z" fill="black"/>
      <path d="M80.4 221.6C76.8 217.6 70 217.6 66 221.6L44 243.6C40 247.6 40 254 44 258C48 262 54.4 262 58.4 258L80.4 236C84.4 232 84.4 225.6 80.4 221.6Z" fill="black"/>
      <path d="M80.4 66.4L58.4 44.4C54.4 40.4 48 40.4 44 44.4C40 48.4 40 54.8 44 58.8L66 80.8C70 84.8 76.4 84.8 80.4 80.8C84.4 76.8 84.4 70.4 80.4 66.4Z" fill="black"/>
    </svg>
    `,
  };
</script>

<script>
  import { onMount, createEventDispatcher, onDestroy } from "svelte";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";

  import _utils from "../runtime/_utils.js";
  import { localDefinitions } from "../runtime/runtime.store";

  import { Validator } from "./_validators";
  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";

  export let config;
  export let humanScript;
  export let inputSet;
  export let blockAddedOnClick;
  export let index;

  let loaded = false;

  const dispatch = createEventDispatcher();

  const parameterNames = ["LED Number", "Layer", "Intensity"];

  const validators = [
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
    (e) => {
      return new Validator(e).NotEmpty().Result();
    },
  ];

  let scriptSegments = [];

  // config.script cannot be undefined
  $: if (config.script && !loaded) {
    scriptSegments = _utils.scriptToSegments({
      short: config.short,
      script: config.script,
    });
    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e, index) {
    scriptSegments[index] = e;
    // important to set the function name = human readable for now
    const script = _utils.segmentsToScript({
      human: config.human,
      short: config.short,
      array: scriptSegments,
    });
    dispatch("output", { short: config.short, script: script });
  }

  const _suggestions = [
    // led number
    [
      //{value: 'this.ind()', info: 'this led'},
    ],
    // layer
    [
      { value: "1", info: "layer 1" },
      { value: "2", info: "layer 2" },
    ],
    // intensity or value
    [
      //{value: 'to do...', info: 'to do...'}
    ],
  ];

  let suggestions = [];

  $: if ($localDefinitions) {
    suggestions = _suggestions.map((s, i) => {
      // SKIP LAYER
      if (i != 1) {
        return [...$localDefinitions, ...s];
      } else {
        return [...s, ...$localDefinitions];
      }
    });
    suggestions = suggestions;
  }

  onMount(() => {
    suggestions = _suggestions;
  });

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
</script>

<config-led-phase class="flex flex-col w-full p-2">
  <div class="w-full flex">
    {#each scriptSegments as script, i}
      <div class={"w-1/" + scriptSegments.length + " atomicInput"}>
        <div class="text-gray-500 text-sm pb-1 truncate">
          {parameterNames[i]}
        </div>
        <AtomicInput
          inputValue={script}
          suggestions={suggestions[i]}
          validator={validators[i]}
          on:active-focus={(e) => {
            onActiveFocus(e, i);
          }}
          on:loose-focus={(e) => {
            onLooseFocus(e, i);
          }}
          on:validator={(e) => {
            const data = e.detail;
            dispatch("validator", data);
          }}
          on:change={(e) => {
            let newValue = e.detail;
            sendData(newValue, i);
          }}
        />
      </div>
    {/each}
  </div>

  {#if showSuggestions}
    <AtomicSuggestions
      {suggestions}
      {focusedInput}
      on:select={(e) => {
        scriptSegments[e.detail.index] = e.detail.value;
        sendData(e.detail.value, e.detail.index);
      }}
    />
  {/if}
</config-led-phase>

<style>
  .atomicInput {
    padding-right: 0.5rem;
  }

  .atomicInput:first-child {
    padding-left: 0.5rem;
  }
</style>
