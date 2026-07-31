<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import ButtonStepFace from "./headers/ButtonStepFace.svelte";
  export const header = ButtonStepFace;

  const icon = `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 19.5h4.4v-4.4h4.4v-4.4h4.4V6.3h3.8"/></svg>`;

  export const information: ActionBlockInformation = {
    short: "bstn",
    name: "ButtonStep_ElseIf",
    rendering: "modifier",
    category: "special",
    displayName: undefined, //Is generated on the face
    defaultLua: "elseif self:bstp() == N then",
    blockIcon: icon,
    color: categoryColors["special"] as any,
    selectable: true,
    movable: false,
    hideIcon: false,
    type: "composite_part",
    toggleable: false,
    menuName: "Additional Step",
    syntaxPreprocessor: new SyntaxPreprocessor(""),
    helperText:
      "Actions here are triggered when the event runs, and button step above is active.",
    editName: false,
    version: "2.0",
  };
</script>
