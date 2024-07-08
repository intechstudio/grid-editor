<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import ForLoopHeader from "./headers/ForLoopHeader.svelte";
  export const header = ForLoopHeader;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "for",
    name: "For_Loop",
    rendering: "modifier",
    rounding: "top",
    category: "loop",
    displayName: "Repeater Loop",
    defaultLua: "for i=1,10,1 do",
    compositeLua: [{ short: "enl", script: "end" }],
    icon: `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="3.32 5.32 17.37 16.37"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8 18H7C5.34315 18 4 16.6569 4 15V9C4 7.34315 5.34315 6 7 6H17C18.6569 6 20 7.34315 20 9V15C20 16.6569 18.6569 18 17 18H12M12 18L15 15M12 18L15 21" stroke="#000000" stroke-width="1.3679999999999999" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`,
    blockIcon: `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="3.32 5.32 17.37 16.37"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8 18H7C5.34315 18 4 16.6569 4 15V9C4 7.34315 5.34315 6 7 6H17C18.6569 6 20 7.34315 20 9V15C20 16.6569 18.6569 18 17 18H12M12 18L15 15M12 18L15 21" stroke="#000000" stroke-width="1.3679999999999999" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`,
    color: "#F4511E",
    selectable: true,
    movable: true,
    hideIcon: true,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor("$SCRIPT$ end"),
    helperText: "Actions here are triggered each time the loop runs.",
  };
</script>
