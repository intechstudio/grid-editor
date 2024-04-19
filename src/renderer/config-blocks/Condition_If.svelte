<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import ConditionIfFace from "./headers/ConditionIfFace.svelte";
  export const header = ConditionIfFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "if",
    name: "Condition_If",
    rendering: "modifier",
    rounding: "top",
    category: "condition",
    displayName: "If",
    defaultLua: "if  then",
    compositeLua: [{ short: "en", script: "end" }],
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 277 277" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M131.429 2.92893C135.334 -0.976311 141.666 -0.976311 145.571 2.92893L274.071 131.429C277.976 135.334 277.976 141.666 274.071 145.571L145.571 274.071C141.666 277.976 135.334 277.976 131.429 274.071L2.92893 145.571C-0.976311 141.666 -0.976311 135.334 2.92893 131.429L131.429 2.92893ZM24.1421 138.5L138.5 252.858L252.858 138.5L138.5 24.1421L24.1421 138.5Z" fill="black"/>
    </svg>
    `,
    blockIcon: `<span class="text-white">If</span>`,
    color: "#F84AA7 ",
    selectable: true,
    movable: true,
    hideIcon: true,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor("$SCRIPT$ end"),
  };
</script>
