<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import CompositeFace from "./headers/CompositeFace.svelte";
  export const header = CompositeFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "epr",
    name: "EncoderPushRot_If",
    rendering: "modifier",
    rounding: "top",
    category: "special",
    displayName: "Push & Rotate",
    menuName: "Push & Rotate",
    defaultLua: "if self:bst()>0 then",
    compositeLua: [
      { short: "eprel", script: "else" },
      { short: "epre", script: "end" },
    ],
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M400.392 94.523C361.836 39.0794 302.088 2.04338 233.396 0.250575L223.795 0H221.205L211.604 0.250575C142.912 2.04338 83.1639 39.0794 44.6076 94.523L0 76.0083L16.2197 200.627L116.392 124.318L78.0685 108.411C111.073 64.4558 159.105 36.8759 212.525 35.4817L222.131 35.231H222.869L232.475 35.4817C285.895 36.8759 333.927 64.4558 366.932 108.411L328.608 124.318L428.78 200.627L445 76.0083L400.392 94.523Z" fill="black"/>
    <path d="M338.147 211.588C338.147 275.328 286.535 327 222.869 327C159.203 327 107.592 275.328 107.592 211.588C107.592 147.848 159.203 96.1765 222.869 96.1765C286.535 96.1765 338.147 147.848 338.147 211.588Z" fill="black"/>
    </svg>
    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M400.392 94.523C361.836 39.0794 302.088 2.04338 233.396 0.250575L223.795 0H221.205L211.604 0.250575C142.912 2.04338 83.1639 39.0794 44.6076 94.523L0 76.0083L16.2197 200.627L116.392 124.318L78.0685 108.411C111.073 64.4558 159.105 36.8759 212.525 35.4817L222.131 35.231H222.869L232.475 35.4817C285.895 36.8759 333.927 64.4558 366.932 108.411L328.608 124.318L428.78 200.627L445 76.0083L400.392 94.523Z" fill="black"/>
    <path d="M338.147 211.588C338.147 275.328 286.535 327 222.869 327C159.203 327 107.592 275.328 107.592 211.588C107.592 147.848 159.203 96.1765 222.869 96.1765C286.535 96.1765 338.147 147.848 338.147 211.588Z" fill="black"/>
    </svg>
    `,
    color: "#4A4AA7 ",
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "grid-protocol";
  import { parenthesis } from "./_validators";

  export let config;
  export let index;

  export let access_tree;

  import LineEditor from "../main/user-interface/LineEditor.svelte";

  let sidebarWidth;

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part

  let loaded = false;

  $: if (config.script && !loaded) {
    scriptSegment = GridScript.humanize(config.script.slice(3, -5));
    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e) {
    if (parenthesis(e)) {
      const script = GridScript.shortify(e);
      dispatch("output", {
        short: information.short,
        script: information.defaultLua,
      });
    }
  }
</script>

<svelte:window bind:innerWidth={sidebarWidth} />

<if-block
  class="{$$props.class} w-full h-fit flex flex-col text-white py-1 pointer-events-auto"
  style="min-height: 2.5rem; background: {information.color};"
>
  <div class="bg-secondary p-1 my-auto mr-1 rounded hidden">
    <LineEditor
      on:output={(e) => {
        sendData(e.detail.script);
      }}
      {access_tree}
      {sidebarWidth}
      value={scriptSegment}
    />
  </div>
</if-block>
