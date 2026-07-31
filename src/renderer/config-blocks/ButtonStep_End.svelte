<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import ButtonStepFace from "./headers/ButtonStepFace.svelte";
  export const header = ButtonStepFace;

  export const information: ActionBlockInformation = {
    short: "bste",
    name: "ButtonStep_End",
    rendering: "modifier",
    category: null,
    displayName: "End",
    rounding: "bottom",
    defaultLua: "end",
    blockIcon: undefined,
    color: categoryColors["special"] as any,
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

<else-block
  class="w-full h-fit flex flex-col text-white py-1 pointer-events-auto"
  style="min-height: 2.5rem; background: {information.color};"
/>
