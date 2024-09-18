<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import ButtonStepFace from "./headers/ButtonStepFace.svelte";
  export const header = ButtonStepFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "bste",
    name: "ButtonStep_End",
    rendering: "modifier",
    category: null,
    displayName: "End",
    rounding: "bottom",
    defaultLua: "end",
    icon: undefined,
    blockIcon: undefined,
    color: "#4A4AA7",
    selectable: false,
    movable: false,
    hideIcon: true,
    type: "composite_close",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
  };
</script>

<else-block
  class="{$$props.class} w-full h-fit flex flex-col text-white py-1 pointer-events-auto"
  style="min-height: 2.5rem; background: {information.color};"
/>
