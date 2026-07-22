<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import ForLoopHeader from "./headers/ForLoopHeader.svelte";
  export const header = ForLoopHeader;

  export const information: ActionBlockInformation = {
    short: "for",
    name: "For_Loop",
    rendering: "modifier",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/iteration/for-loop/",
    rounding: "top",
    category: "loop",
    displayName: "Repeater Loop",
    description: "Actions here are triggered each time the loop runs.",
    defaultLua: "for i=1,5 do",
    compositeLua: [{ short: "enl", script: "end" }],
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m17 2.5 4 4-4 4"/><path d="M3 11.5v-1a4 4 0 0 1 4-4h14"/><path d="m7 21.5-4-4 4-4"/><path d="M21 12.5v1a4 4 0 0 1-4 4H3"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m17 2.5 4 4-4 4"/><path d="M3 11.5v-1a4 4 0 0 1 4-4h14"/><path d="m7 21.5-4-4 4-4"/><path d="M21 12.5v1a4 4 0 0 1-4 4H3"/></svg>`,
    color: categoryColors["loop"] as any,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor("$SCRIPT$ end"),
    helperText: "Actions here are triggered each time the loop runs.",
    hiddenInMinimalist: true,
    editName: false,
    version: "2.0",
  };
</script>
