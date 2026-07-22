<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import FunctionStartFace from "./headers/FunctionStartFace.svelte";
  export const header = FunctionStartFace;

  export const information: ActionBlockInformation = {
    short: "fst",
    name: "Function_Start",
    rendering: "modifier",
    documentationUrl:
      "https://docs.intech.studio/wiki/actions/function/function/",
    rounding: "top",
    category: "function",
    displayName: "Function",
    description: "Actions here are triggered when this function is called.",
    defaultLua: "YourFunction = function()",
    compositeLua: [{ short: "fen", script: "end" }],
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10.8 5c-1.9 0-2.7 1-3 2.9L6.2 19"/><path d="M5.6 10.6h4.8"/><path d="m13.4 11 5.6 8M19 11l-5.6 8"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10.8 5c-1.9 0-2.7 1-3 2.9L6.2 19"/><path d="M5.6 10.6h4.8"/><path d="m13.4 11 5.6 8M19 11l-5.6 8"/></svg>`,
    color: categoryColors["function"] as any,
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "composite_open",
    helperText: "Actions here are triggered when this function is called.",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor("$SCRIPT$ end"),
    hiddenInMinimalist: true,
    editName: false,
    version: "2.0",
  };
</script>
