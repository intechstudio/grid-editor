<script context="module">
  // config descriptor parameters
  export const information = {
    short: "if",
    name: "Condition_If",
    rendering: "modifier",
    rounding: "top",
    hiddenIcon: true,
    category: "condition",
    desc: "IF",
    blockTitle: "IF",
    defaultLua: "if  then --[[@en]] end",
    icon: `
    <svg width="100%" height="100%" viewBox="0 0 277 277" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M131.429 2.92893C135.334 -0.976311 141.666 -0.976311 145.571 2.92893L274.071 131.429C277.976 135.334 277.976 141.666 274.071 145.571L145.571 274.071C141.666 277.976 135.334 277.976 131.429 274.071L2.92893 145.571C-0.976311 141.666 -0.976311 135.334 2.92893 131.429L131.429 2.92893ZM24.1421 138.5L138.5 252.858L252.858 138.5L138.5 24.1421L24.1421 138.5Z" fill="black"/>
    </svg>
    `,
    color: "#F84AA7 ",
  };
</script>

<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import stringManipulation from "../main/user-interface/_string-operations";
  import { parenthesis } from "./_validators";

  export let config = "";
  export let index;

  export let access_tree;

  import LineEditor from "../main/user-interface/LineEditor.svelte";

  import { windowSize } from "../runtime/window-size";

  let sidebarWidth;

  $: if (windowSize.rightSidebarWidth) {
    sidebarWidth = windowSize.rightSidebarWidth;
  }

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part

  let loaded = false;

  $: if (config.script && !loaded) {
    scriptSegment = stringManipulation.humanize(config.script.slice(3, -5));
    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e) {
    if (parenthesis(e)) {
      const script = stringManipulation.shortify(e);
      dispatch("output", {
        short: `if`,
        script: `if ${script} then`,
        toValidate: `local x = ${script}`,
      });
    }
  }
</script>

<if-block class="w-full h-fit flex text-white py-1">
  <div class="bg-secondary p-1 my-auto mr-1 rounded flex items-center w-full">
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
