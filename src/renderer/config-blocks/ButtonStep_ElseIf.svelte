<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import ButtonStepFace from "./headers/ButtonStepFace.svelte";
  export const header = ButtonStepFace;

  const icon = `<svg width="100%" height="100%" id="icon" xmlns="http://www.w3.org/2000/svg" viewBox="2 2 28 28"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <defs> <style> .cls-1 { fill: none; } </style> </defs> <rect x="10.3431" y="10.3431" width="11.3137" height="11.3137" transform="translate(-6.6274 16) rotate(-45)"></rect> <path d="M16,30a2.0763,2.0763,0,0,1-1.4732-.6094L2.6094,17.4732a2.0855,2.0855,0,0,1,0-2.9464L14.5268,2.6094a2.0855,2.0855,0,0,1,2.9464,0L29.3906,14.5268a2.0855,2.0855,0,0,1,0,2.9464L17.4732,29.3906A2.0763,2.0763,0,0,1,16,30ZM16,3.9992a.0841.0841,0,0,0-.0591.0244L4.0236,15.9409a.0838.0838,0,0,0,0,.1182L15.9409,27.9764a.0842.0842,0,0,0,.1182,0L27.9764,16.0591a.0838.0838,0,0,0,0-.1182L16.0591,4.0236A.0841.0841,0,0,0,16,3.9992Z"></path> <rect id="_Transparent_Rectangle_" data-name=" Transparent Rectangle " class="cls-1" width="32" height="32"></rect> </g></svg>`;
  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "bstn",
    name: "ButtonStep_ElseIf",
    rendering: "modifier",
    category: "special",
    displayName: undefined, //Is generated on the face
    defaultLua: "elseif self:bstp() == N then",
    icon: icon,
    blockIcon: icon,
    color: "#4A4AA7",
    selectable: true,
    movable: false,
    hideIcon: false,
    type: "composite_part",
    toggleable: false,
    menuName: "Additional Step",
    syntaxPreprocessor: new SyntaxPreprocessor(""),
    helperText:
      "Actions here are triggered when the event runs, and button step above is active.",
  };
</script>
