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
    short: "bpr",
    name: "ButtonPressRelease_If",
    menuName: "Press/Release",
    rendering: "modifier",
    rounding: "top",
    category: "special",
    displayName: "Press",
    defaultLua: "if self:bst()>0 then",
    compositeLua: [
      { short: "bprel", script: "else" },
      { short: "bpre", script: "end" },
    ],
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
   
      <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.809819"
     id="rect365-3"
     width="203.78975"
     height="35.209686"
     x="120.60513"
     y="-337.43585"
     transform="scale(1,-1)" />
  <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.803988"
     id="rect365"
     width="37.381088"
     height="189.19719"
     x="203.80945"
     y="1.8109859" />
  <path
     sodipodi:type="star"
     style="fill:#000000;fill-rule:evenodd"
     id="path653"
     inkscape:flatsided="false"
     sodipodi:sides="3"
     sodipodi:cx="222.688"
     sodipodi:cy="253.84973"
     sodipodi:r1="83.359268"
     sodipodi:r2="41.679634"
     sodipodi:arg1="-0.52359878"
     sodipodi:arg2="0.52359878"
     inkscape:rounded="0"
     inkscape:randomized="0"
     inkscape:transform-center-y="20.839817"
     transform="translate(-0.18800336,-64.43105)"
     d="M 294.87925,212.1701 258.78363,274.68955 222.688,337.209 186.59238,274.68955 150.49676,212.1701 l 72.19124,0 z" />
    </svg>
    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
   
      <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.809819"
     id="rect365-3"
     width="203.78975"
     height="35.209686"
     x="120.60513"
     y="-337.43585"
     transform="scale(1,-1)" />
  <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.803988"
     id="rect365"
     width="37.381088"
     height="189.19719"
     x="203.80945"
     y="1.8109859" />
  <path
     sodipodi:type="star"
     style="fill:#000000;fill-rule:evenodd"
     id="path653"
     inkscape:flatsided="false"
     sodipodi:sides="3"
     sodipodi:cx="222.688"
     sodipodi:cy="253.84973"
     sodipodi:r1="83.359268"
     sodipodi:r2="41.679634"
     sodipodi:arg1="-0.52359878"
     sodipodi:arg2="0.52359878"
     inkscape:rounded="0"
     inkscape:randomized="0"
     inkscape:transform-center-y="20.839817"
     transform="translate(-0.18800336,-64.43105)"
     d="M 294.87925,212.1701 258.78363,274.68955 222.688,337.209 186.59238,274.68955 150.49676,212.1701 l 72.19124,0 z" />
    </svg>
    `,
    color: "#4A4AA7 ",
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
    helperText: "Actions here are triggered when the button is pressed.",
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { parenthesis } from "./_validators";

  export let config;
  export let index;

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
      action={config.runtimeRef}
      {sidebarWidth}
      value={scriptSegment}
    />
  </div>
</if-block>
