<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information = {
    short: "bprel",
    name: "ButtonPressRelease_Else",
    rendering: "modifier",
    category: null,
    desc: "Release",
    blockTitle: "Release",
    defaultLua: "else",
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.803988"
     id="rect365"
     width="37.381088"
     height="189.19719"
     x="203.80945"
     y="-272.77795"
     transform="scale(1,-1)" />
  <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.809819"
     id="rect365-3"
     width="203.78975"
     height="35.209686"
     x="120.60513"
     y="-337.43585"
     transform="scale(1,-1)" />
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
     d="M 294.87925,212.1701 258.78363,274.68955 222.688,337.209 186.59238,274.68955 150.49676,212.1701 l 72.19124,0 z"
     transform="matrix(1,0,0,-1,-0.18800336,339.01999)" />

    </svg>

    `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.803988"
     id="rect365"
     width="37.381088"
     height="189.19719"
     x="203.80945"
     y="-272.77795"
     transform="scale(1,-1)" />
  <rect
     style="fill:#000000;fill-rule:evenodd;stroke-width:0.809819"
     id="rect365-3"
     width="203.78975"
     height="35.209686"
     x="120.60513"
     y="-337.43585"
     transform="scale(1,-1)" />
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
     d="M 294.87925,212.1701 258.78363,274.68955 222.688,337.209 186.59238,274.68955 150.49676,212.1701 l 72.19124,0 z"
     transform="matrix(1,0,0,-1,-0.18800336,339.01999)" />

    </svg>

    `,
    color: "#4A4AA7",
    selectable: false,
    movable: false,
    hideIcon: false,
    type: "composite_part",
    toggleable: false,
  };
</script>

<script>
  import { onMount, createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function sendData() {
    dispatch("output", {
      short: information.short,
      script: information.defaultLua,
    });
  }
</script>

<else-block
  class="{$$props.class} w-full h-fit flex flex-col text-white py-1 pointer-events-auto"
  style="min-height: 2.5rem; background: {information.color};"
/>
