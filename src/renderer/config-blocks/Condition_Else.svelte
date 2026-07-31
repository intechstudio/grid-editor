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
    short: "el",
    name: "Condition_Else",
    rendering: "modifier",
    category: "condition",
    displayName: "Else",
    description:
      "Actions here are triggered when the event runs, and no others conditions were met.",
    defaultLua: "else",
    color: categoryColors["condition"] as any,
    blockIcon: `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M6 15.4V6"/><path d="M18 8.6a9 9 0 0 1-9 9"/></svg>`,
    selectable: true,
    movable: false,
    hideIcon: true,
    type: "composite_part",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
    helperText:
      "Actions here are triggered when the event runs, and no others conditions were met.",
    editName: false,
    version: "2.0",
  };
</script>
