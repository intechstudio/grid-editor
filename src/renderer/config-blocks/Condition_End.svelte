<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import CompositeFace from "./headers/CompositeFace.svelte";
  export const header = CompositeFace;

  export const information: ActionBlockInformation = {
    short: "en",
    name: "Condition_End",
    rendering: "modifier",
    rounding: "bottom",
    category: null,
    displayName: "End",
    defaultLua: "end",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m17 2.5 4 4-4 4"/><path d="M3 11.5v-1a4 4 0 0 1 4-4h14"/><path d="m7 21.5-4-4 4-4"/><path d="M21 12.5v1a4 4 0 0 1-4 4H3"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m17 2.5 4 4-4 4"/><path d="M3 11.5v-1a4 4 0 0 1 4-4h14"/><path d="m7 21.5-4-4 4-4"/><path d="M21 12.5v1a4 4 0 0 1-4 4H3"/></svg>`,
    color: categoryColors["condition"] as any,
    selectable: false,
    movable: false,
    hideIcon: true,
    type: "composite_close",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
    editName: false,
    version: "2.0",
  };
</script>
