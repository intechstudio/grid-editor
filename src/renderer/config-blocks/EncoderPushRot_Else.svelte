<script context="module">
  // Component for the untoggled "header" of the component
  import RegularActionBlockFace from "./headers/RegularActionBlockFace.svelte";
  export const header = RegularActionBlockFace;

  // config descriptor parameters
  export const information = {
    short: "eprel",
    name: "EncoderPushRot_Else",
    rendering: "modifier",
    category: null,
    desc: "Just Rotate",
    blockTitle: "Just Rotate",
    defaultLua: "else",
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M400.392 94.4129C361.836 39.0338 302.088 2.041 233.396 0.250283L223.795 0H221.205L211.604 0.250283C142.912 2.041 83.1639 39.0338 44.6076 94.4129L0 75.9197L16.2197 200.394L116.392 124.173L78.0685 108.285C111.073 64.3807 159.105 36.8329 212.525 35.4403L222.131 35.1899H222.869L232.475 35.4403C285.895 36.8329 333.927 64.3807 366.932 108.285L328.608 124.173L428.78 200.394L445 75.9197L400.392 94.4129Z" fill="black"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M222.87 297.8C270.619 297.8 309.327 259.091 309.327 211.342C309.327 163.592 270.619 124.884 222.87 124.884C175.12 124.884 136.412 163.592 136.412 211.342C136.412 259.091 175.12 297.8 222.87 297.8ZM222.87 326.619C286.535 326.619 338.147 275.008 338.147 211.342C338.147 147.676 286.535 96.0645 222.87 96.0645C159.204 96.0645 107.592 147.676 107.592 211.342C107.592 275.008 159.204 326.619 222.87 326.619Z" fill="black"/>
    </svg>`,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 445 327" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M400.392 94.4129C361.836 39.0338 302.088 2.041 233.396 0.250283L223.795 0H221.205L211.604 0.250283C142.912 2.041 83.1639 39.0338 44.6076 94.4129L0 75.9197L16.2197 200.394L116.392 124.173L78.0685 108.285C111.073 64.3807 159.105 36.8329 212.525 35.4403L222.131 35.1899H222.869L232.475 35.4403C285.895 36.8329 333.927 64.3807 366.932 108.285L328.608 124.173L428.78 200.394L445 75.9197L400.392 94.4129Z" fill="black"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M222.87 297.8C270.619 297.8 309.327 259.091 309.327 211.342C309.327 163.592 270.619 124.884 222.87 124.884C175.12 124.884 136.412 163.592 136.412 211.342C136.412 259.091 175.12 297.8 222.87 297.8ZM222.87 326.619C286.535 326.619 338.147 275.008 338.147 211.342C338.147 147.676 286.535 96.0645 222.87 96.0645C159.204 96.0645 107.592 147.676 107.592 211.342C107.592 275.008 159.204 326.619 222.87 326.619Z" fill="black"/>
    </svg>`,
    color: "#4A4AA7",
    selectable: false,
    movable: false,
    hideIcon: false,
    type: "composite_part",
    toggleable: false,
  };
</script>

<else-block
  class="{$$props.class} w-full h-fit flex flex-col text-white py-1 pointer-events-auto"
  style="min-height: 2.5rem; background: {information.color};"
/>
