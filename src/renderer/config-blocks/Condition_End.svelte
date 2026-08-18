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

    blockIcon: ``,
    color: categoryColors["condition"],
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
