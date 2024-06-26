<script lang="ts" context="module">
  import {
    type ActionBlockInformation,
    SyntaxPreprocessor,
  } from "./ActionBlockInformation";
  // Component for the untoggled "header" of the component
  import CompositeFace from "./headers/CompositeFace.svelte";
  export const header = CompositeFace;

  // config descriptor parameters
  export const information: ActionBlockInformation = {
    short: "elr",
    name: "EncoderLeftRight_If",
    rendering: "modifier",
    rounding: "top",
    category: "special",
    displayName: "Rotate Left",
    menuName: "Left/Right Rotate",
    defaultLua: "if self:est()<64 then",
    compositeLua: [
      { short: "elrel", script: "else" },
      { short: "elre", script: "end" },
    ],
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 445 338" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
     fill-rule="evenodd"
     clip-rule="evenodd"
     d="M362.457 89.786C324.915 49.1659 274.185 25.0518 219.158 26.4863C156.42 28.1218 100.934 62.6639 65.3276 116.012L100.43 130.565L24.3675 188.44L12.0516 93.9256L49.754 109.556C87.8056 50.9138 148.732 11.8089 218.724 9.98434C279.12 8.40988 334.291 34.9308 374.659 78.6088C399.329 105.302 418.516 138.435 430.113 175.622L432.571 183.505L416.735 188.399L414.277 180.517C403.384 145.587 385.408 114.619 362.457 89.786Z"
     fill="black"
     id="path1249" />
    <path
     fill-rule="evenodd"
     clip-rule="evenodd"
     d="M12.0516 93.9256L49.754 109.556C87.8056 50.9138 148.732 11.8089 218.724 9.98434C279.12 8.40988 334.291 34.9308 374.659 78.6088C398.978 104.922 417.97 137.494 429.614 174.038C429.782 174.566 429.948 175.094 430.113 175.622L432.57 183.499L432.571 183.505L416.735 188.399L416.734 188.395L414.277 180.517C403.384 145.587 385.408 114.619 362.457 89.786C324.915 49.1659 274.185 25.0518 219.158 26.4863C159.744 28.0351 106.836 59.0953 71.1543 107.692C69.1576 110.411 67.2146 113.185 65.3276 116.012L100.43 130.565L24.3675 188.44L12.0516 93.9256ZM80.5998 111.607L120.166 128.011L16.7456 206.703L0 78.1928L46.054 97.2856C85.8604 40.111 147.546 1.91866 218.465 0.0698728C282.057 -1.58788 339.88 26.3655 381.943 71.8773C407.644 99.686 427.56 134.122 439.582 172.67L445 190.045L410.212 200.796L404.809 183.47C394.341 149.902 377.093 120.235 355.173 96.5177C319.328 57.7331 271.251 35.0497 219.416 36.4009C164.264 37.8387 114.674 66.2797 80.5998 111.607Z"
     fill="black"
     id="path1251" />
    </svg> `,
    blockIcon: `
    <svg width="100%" height="100%" viewBox="0 0 445 338" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
     fill-rule="evenodd"
     clip-rule="evenodd"
     d="M362.457 89.786C324.915 49.1659 274.185 25.0518 219.158 26.4863C156.42 28.1218 100.934 62.6639 65.3276 116.012L100.43 130.565L24.3675 188.44L12.0516 93.9256L49.754 109.556C87.8056 50.9138 148.732 11.8089 218.724 9.98434C279.12 8.40988 334.291 34.9308 374.659 78.6088C399.329 105.302 418.516 138.435 430.113 175.622L432.571 183.505L416.735 188.399L414.277 180.517C403.384 145.587 385.408 114.619 362.457 89.786Z"
     fill="black"
     id="path1249" />
    <path
     fill-rule="evenodd"
     clip-rule="evenodd"
     d="M12.0516 93.9256L49.754 109.556C87.8056 50.9138 148.732 11.8089 218.724 9.98434C279.12 8.40988 334.291 34.9308 374.659 78.6088C398.978 104.922 417.97 137.494 429.614 174.038C429.782 174.566 429.948 175.094 430.113 175.622L432.57 183.499L432.571 183.505L416.735 188.399L416.734 188.395L414.277 180.517C403.384 145.587 385.408 114.619 362.457 89.786C324.915 49.1659 274.185 25.0518 219.158 26.4863C159.744 28.0351 106.836 59.0953 71.1543 107.692C69.1576 110.411 67.2146 113.185 65.3276 116.012L100.43 130.565L24.3675 188.44L12.0516 93.9256ZM80.5998 111.607L120.166 128.011L16.7456 206.703L0 78.1928L46.054 97.2856C85.8604 40.111 147.546 1.91866 218.465 0.0698728C282.057 -1.58788 339.88 26.3655 381.943 71.8773C407.644 99.686 427.56 134.122 439.582 172.67L445 190.045L410.212 200.796L404.809 183.47C394.341 149.902 377.093 120.235 355.173 96.5177C319.328 57.7331 271.251 35.0497 219.416 36.4009C164.264 37.8387 114.674 66.2797 80.5998 111.607Z"
     fill="black"
     id="path1251" />
    </svg> `,
    color: "#4A4AA7 ",
    selectable: true,
    movable: true,
    hideIcon: false,
    type: "composite_open",
    toggleable: false,
    syntaxPreprocessor: new SyntaxPreprocessor(""),
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "grid-protocol";
  import { parenthesis } from "./_validators";

  export let config;
  export let index;

  export let access_tree;

  import LineEditor from "../main/user-interface/LineEditor.svelte";

  let sidebarWidth;

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part

  let loaded = false;

  $: if (config.script && !loaded) {
    scriptSegment = GridScript.humanize(config.script.slice(3, -5));
    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e) {
    if (parenthesis(e)) {
      const script = GridScript.shortify(e);
      dispatch("output", {
        short: information.short,
        script: information.defaultLua,
      });
    }
  }
</script>

<svelte:window bind:innerWidth={sidebarWidth} />

<if-block
  class="{$$props.class} w-full h-fit flex flex-col text-white py-1 pointer-events-auto"
  style="min-height: 2.5rem; background: {information.color};"
>
  <div class="bg-secondary p-1 my-auto mr-1 rounded hidden">
    <LineEditor
      on:output={(e) => {
        sendData(e.detail.script);
      }}
      {access_tree}
      {sidebarWidth}
      value={scriptSegment}
    />
  </div>
</if-block>
