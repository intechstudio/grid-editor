<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information = {
    short: "gmbs",
    name: "MouseButton",
    rendering: "standard",
    category: "mouse",
    desc: "Button",
    blockTitle: "Button",
    defaultLua: "gmbs(,)",
    color: "#9C92A4",
    icon: `
    <svg width="100%" height="100%" viewBox="-96 0 512 512"  xmlns="http://www.w3.org/2000/svg">
      <path d="m180.777344 512c-2.023438 0-4.03125-.382812-5.949219-1.152344-3.96875-1.578125-7.125-4.691406-8.789063-8.640625l-59.863281-141.84375-71.144531 62.890625c-2.988281 3.070313-8.34375 5.269532-13.890625 5.269532-11.648437 0-21.140625-9.515626-21.140625-21.226563v-386.070313c0-11.710937 9.492188-21.226562 21.140625-21.226562 4.929687 0 9.707031 1.726562 13.761719 5.011719l279.058594 282.96875c4.355468 5.351562 6.039062 10.066406 6.039062 14.972656 0 11.691406-9.492188 21.226563-21.140625 21.226563h-94.785156l57.6875 136.8125c3.410156 8.085937-.320313 17.386718-8.363281 20.886718l-66.242188 28.796875c-2.027344.875-4.203125 1.324219-6.378906 1.324219zm-68.5-194.367188c1.195312 0 2.367187.128907 3.5625.40625 5.011718 1.148438 9.195312 4.628907 11.179687 9.386719l62.226563 147.453125 36.886718-16.042968-60.90625-144.445313c-2.089843-4.929687-1.558593-10.605469 1.40625-15.0625 2.96875-4.457031 7.980469-7.148437 13.335938-7.148437h93.332031l-241.300781-244.671876v335.765626l69.675781-61.628907c2.941407-2.605469 6.738281-4.011719 10.601563-4.011719zm-97.984375 81.300782c-.449219.339844-.851563.703125-1.238281 1.085937zm275.710937-89.8125h.214844zm0 0"/>
    </svg>
    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="-96 0 512 512"  xmlns="http://www.w3.org/2000/svg">
      <path d="m180.777344 512c-2.023438 0-4.03125-.382812-5.949219-1.152344-3.96875-1.578125-7.125-4.691406-8.789063-8.640625l-59.863281-141.84375-71.144531 62.890625c-2.988281 3.070313-8.34375 5.269532-13.890625 5.269532-11.648437 0-21.140625-9.515626-21.140625-21.226563v-386.070313c0-11.710937 9.492188-21.226562 21.140625-21.226562 4.929687 0 9.707031 1.726562 13.761719 5.011719l279.058594 282.96875c4.355468 5.351562 6.039062 10.066406 6.039062 14.972656 0 11.691406-9.492188 21.226563-21.140625 21.226563h-94.785156l57.6875 136.8125c3.410156 8.085937-.320313 17.386718-8.363281 20.886718l-66.242188 28.796875c-2.027344.875-4.203125 1.324219-6.378906 1.324219zm-68.5-194.367188c1.195312 0 2.367187.128907 3.5625.40625 5.011718 1.148438 9.195312 4.628907 11.179687 9.386719l62.226563 147.453125 36.886718-16.042968-60.90625-144.445313c-2.089843-4.929687-1.558593-10.605469 1.40625-15.0625 2.96875-4.457031 7.980469-7.148437 13.335938-7.148437h93.332031l-241.300781-244.671876v335.765626l69.675781-61.628907c2.941407-2.605469 6.738281-4.011719 10.601563-4.011719zm-97.984375 81.300782c-.449219.339844-.851563.703125-1.238281 1.085937zm275.710937-89.8125h.214844zm0 0"/>
    </svg>
    `,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "single",
    toggleable: true,
  };
</script>

<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import AtomicInput from "../main/user-interface/AtomicInput.svelte";
  import AtomicSuggestions from "../main/user-interface/AtomicSuggestions.svelte";
  import { configManager } from "../main/panels/configuration/Configuration.store";
  import { Script } from "./_script_parsers.js";
  import { Validator } from "./_validators";

  export let config = "";
  export let index;

  const dispatch = createEventDispatcher();

  const parameterNames = ["Button", "State"];
  const validators = [
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
    scriptSegments = Script.toSegments({
      short: config.short,
      script: config.script,
    });

    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(value, index) {
    scriptSegments[index] = value;

    const script = Script.toScript({
      human: config.human,
      short: config.short,
      array: scriptSegments,
    });
    dispatch("output", { short: config.short, script: script });
  }

  let suggestions = [];

  const _suggestions = [
    [
      { value: "1", info: "Left Button" },
      { value: "2", info: "Right Button" },
      { value: "4", info: "Middle Button" },
    ],
    [
      { value: "1", info: "Press" },
      { value: "0", info: "Release" },
    ],
  ];

  onMount(() => {
    suggestions = _suggestions;
  });

  let suggestionElement = undefined;
</script>

<mouse-button
  class="{$$props.class} flex flex-col w-full p-2 pointer-events-auto"
>
  <div class="w-full flex">
    {#each scriptSegments as script, i}
      <div class={"w-1/" + scriptSegments.length + " atomicInput"}>
        <div class="text-gray-500 text-sm pb-1">{parameterNames[i]}</div>
        <AtomicInput
          inputValue={script}
          suggestions={suggestions[i]}
          validator={validators[i]}
          suggestionTarget={suggestionElement}
          on:validator={(e) => {
            const data = e.detail;
            dispatch("validator", data);
          }}
          on:change={(e) => {
            sendData(e.detail, i);
          }}
        />
      </div>
    {/each}
  </div>

  <AtomicSuggestions bind:component={suggestionElement} />
</mouse-button>

<style>
  .atomicInput {
    padding-right: 0.5rem;
  }

  .atomicInput:first-child {
    padding-left: 0.5rem;
  }
</style>
