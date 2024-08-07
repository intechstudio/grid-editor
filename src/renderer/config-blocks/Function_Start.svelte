<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import FunctionStartFace from "./headers/FunctionStartFace.svelte";
  export const header = FunctionStartFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "fst",
    name: "Function_Start",
    rendering: "modifier",
    rounding: "top",
    category: "function",
    displayName: "Function",
    defaultLua: "function YourFunction()",
    compositeLua: [{ short: "fen", script: "end" }],
    icon: `
      <svg class="svg-icon" style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <path d="M768 921.6H275.2c-83.2 0-147.2-64-147.2-147.2V275.2C128 192 192 128 275.2 128H768c83.2 0 147.2 64 147.2 147.2 0 25.6-12.8 32-38.4 32s-38.4-12.8-38.4-32c0-38.4-32-70.4-70.4-70.4H275.2c-38.4 0-70.4 32-70.4 70.4v499.2c0 38.4 32 70.4 70.4 70.4H768c38.4 0 70.4-32 70.4-70.4 0-19.2 19.2-38.4 38.4-38.4s38.4 19.2 38.4 38.4c0 76.8-64 147.2-147.2 147.2z m-38.4-281.6c-6.4 0-19.2 0-25.6-6.4L582.4 499.2c-12.8-12.8-12.8-32 0-44.8 12.8-12.8 32-12.8 44.8 0l121.6 134.4c12.8 12.8 12.8 32 0 44.8 0 6.4-6.4 6.4-19.2 6.4z m-140.8 12.8c-6.4 0-12.8 0-19.2-6.4-12.8-12.8-12.8-25.6 0-38.4l166.4-172.8c12.8-12.8 25.6-12.8 38.4 0s12.8 25.6 0 38.4l-166.4 172.8c-6.4 6.4-12.8 6.4-19.2 6.4z m-44.8-377.6c12.8 0 44.8 6.4 44.8 38.4 0 25.6-38.4 19.2-51.2 19.2-57.6 0-76.8 32-83.2 57.6l-12.8 76.8h64c12.8 0 25.6 12.8 25.6 25.6s-12.8 25.6-25.6 25.6H435.2l-44.8 198.4s-6.4 57.6-44.8 57.6-19.2-57.6-19.2-57.6l44.8-192h-57.6c-12.8 0-25.6-12.8-25.6-25.6 0-25.6 12.8-32 25.6-32H384L403.2 384C416 275.2 512 268.8 544 275.2z m326.4 115.2c6.4-19.2 19.2-25.6 38.4-25.6 19.2 6.4 25.6 19.2 25.6 38.4l-64 256c-6.4 19.2-19.2 25.6-38.4 25.6-19.2-6.4-25.6-19.2-25.6-38.4l64-256z" fill="#333333" />
      </svg>
      `,
    blockIcon: `<span class="text-white">If</span>`,
    color: "#4474c2 ",
    selectable: true,
    movable: true,
    hideIcon: true,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor("$SCRIPT$ end"),
  };
</script>
