<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import ConditionElseIfFace from "./headers/ConditionElseIfFace.svelte";
  export const header = ConditionElseIfFace;

  export const information: ActionBlockInformation = {
    short: "ei",
    name: "Condition_ElseIf",
    rendering: "modifier",
    category: "condition",
    displayName: "Else if",
    defaultLua: "elseif true then",
    description:
      "Actions here are triggered when the event runs, the expression above is true, and none of the others before were.",
    icon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M6 15.4V6"/><path d="M18 8.6a9 9 0 0 1-9 9"/></svg>`,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M6 15.4V6"/><path d="M18 8.6a9 9 0 0 1-9 9"/></svg>`,
    color: categoryColors["condition"] as any,
    selectable: true,
    movable: false,
    hideIcon: true,
    type: "composite_part",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor("if true then $SCRIPT$ end"),
    helperText:
      "Actions here are triggered when the event runs, the expression above is true, and none of the others before were.",
    editName: false,
    version: "2.0",
  };
</script>
