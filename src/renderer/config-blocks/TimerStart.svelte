<script context="module">
  // config descriptor parameters
  export const information = {
    short: "gtt",
    name: "TimerStart",
    category: "timer",
    rendering: "standard",
    desc: "Start",
    color: "#95638D",
    defaultLua: "gtt(,)",
    icon: `
    <svg height="100%" width="100%" viewBox="0 0 384 384" xmlns="http://www.w3.org/2000/svg">
      <path d="m343.59375 101.039062c-7.953125 3.847657-11.28125 13.417969-7.433594 21.367188 10.511719 21.714844 15.839844 45.121094 15.839844 69.59375 0 88.222656-71.777344 160-160 160s-160-71.777344-160-160 71.777344-160 160-160c36.558594 0 70.902344 11.9375 99.328125 34.519531 6.894531 5.503907 16.976563 4.351563 22.480469-2.566406 5.503906-6.914063 4.351562-16.984375-2.570313-22.480469-33.652343-26.746094-76-41.472656-119.238281-41.472656-105.863281 0-192 86.136719-192 192s86.136719 192 192 192 192-86.136719 192-192c0-29.335938-6.40625-57.449219-19.039062-83.527344-3.839844-7.96875-13.441407-11.289062-21.367188-7.433594zm0 0"/><path d="m192 64c-8.832031 0-16 7.167969-16 16v112c0 8.832031 7.167969 16 16 16h80c8.832031 0 16-7.167969 16-16s-7.167969-16-16-16h-64v-96c0-8.832031-7.167969-16-16-16zm0 0"/>
    </svg>
    `,
  };
</script>

<script>
  import { onMount, createEventDispatcher, onDestroy } from "svelte";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";

  import _utils from "../runtime/_utils.js";

  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";
  import { localDefinitions } from "../runtime/runtime.store";
  import { Validator } from "./_validators";

  export let config;

  const dispatch = createEventDispatcher();

  const parameterNames = ["Element Number", "Time"];
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

  let loaded = false;

  $: if (config.script && !loaded) {
    scriptSegments = _utils.scriptToSegments({
      short: config.short,
      script: config.script,
    });

    loaded = true;
  }

  function sendData(e, index) {
    scriptSegments[index] = e;
    const script = _utils.segmentsToScript({
      human: config.human,
      short: config.short,
      array: scriptSegments,
    });
    dispatch("output", { short: config.short, script: script });
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

  let suggestions = [];

  const _suggestions = [[], []];

  $: if ($localDefinitions) {
    suggestions = _suggestions.map((s, i) => {
      // SKIP LAYER
      return [...s, ...$localDefinitions];
    });
    suggestions = suggestions;
  }

  onDestroy(() => {
    loaded = false;
  });
</script>

<timer-start class="flex flex-col w-full p-2">
  <div class="w-full flex">
    {#each scriptSegments as script, i}
      <div class={"w-1/" + scriptSegments.length + " atomicInput"}>
        <div class="text-gray-500 text-sm pb-1">{parameterNames[i]}</div>
        <AtomicInput
          inputValue={script}
          suggestions={suggestions[i]}
          validator={validators[i]}
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
          on:change={(e) => {
            sendData(e.detail, i);
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
</timer-start>

<style>
  .atomicInput {
    padding-right: 0.5rem;
  }

  .atomicInput:first-child {
    padding-left: 0.5rem;
  }
</style>
