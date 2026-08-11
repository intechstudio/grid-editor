<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  import { categoryColors } from "./categoryColors";
  // Component for the untoggled "header" of the component
  import ButtonStepFace from "./headers/ButtonStepFace.svelte";
  import * as ButtonStepElseIf from "./ButtonStep_ElseIf.svelte";
  import * as ButtonStepEnd from "./ButtonStep_End.svelte";
  export const header = ButtonStepFace;

  const icon = `<svg class="stroke-icon" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 19.5h4.4v-4.4h4.4v-4.4h4.4V6.3h3.8"/></svg>`;

  export const information: ActionBlockInformation = {
    short: "bst0",
    name: "ButtonStep_If",
    menuName: "Button Step",
    rendering: "modifier",
    rounding: "top",
    category: "special",
    displayName: "Button Off",
    description:
      "Actions here are triggered when the event runs, and button is in it's off step.",
    defaultLua: "if self:bstp() == 0 then",
    compositeLua: [
      {
        short: ButtonStepElseIf.information.short,
        script: ButtonStepElseIf.information.defaultLua,
      },
      {
        short: ButtonStepEnd.information.short,
        script: ButtonStepEnd.information.defaultLua,
      },
    ],
    blockIcon: icon,
    color: categoryColors["special"],
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
    helperText:
      "Actions here are triggered when the event runs, and button is in it's off step.",
    editName: false,
    version: "2.0",
  };
</script>
