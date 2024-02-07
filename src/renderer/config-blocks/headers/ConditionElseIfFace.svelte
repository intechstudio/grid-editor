<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import stringManipulation from "../../main/user-interface/_string-operations";
  import { parenthesis } from "../_validators";

  const dispatch = createEventDispatcher();

  export let config;
  export let index;

  export let access_tree;

  import LineEditor from "../../main/user-interface/LineEditor.svelte";

  import { windowSize } from "../../runtime/window-size";

  let sidebarWidth;

  $: if (windowSize.rightSidebarWidth) {
    sidebarWidth = windowSize.rightSidebarWidth;
  }

  let loaded = false;

  let scriptSegment = ""; // local script part

  $: if (config.script && !loaded) {
    scriptSegment = stringManipulation.humanize(config.script.slice(7, -5));
    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e) {
    if (parenthesis(e)) {
      const script = stringManipulation.shortify(e);
      dispatch("output", { short: "ei", script: `elseif ${script} then` });
    }
  }
</script>

<else-if-block
  class="{$$props.class} w-full h-fit flex text-white py-1 pointer-events-auto"
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row items-center w-full gap-3">
    <span class="text-white min-w-fit">Else if</span>

    <div
      class="bg-secondary p-1 my-auto mr-1 rounded flex items-center flex-grow h-full"
    >
      <LineEditor
        on:change={(e) => {
          sendData(e.detail.script);
        }}
        {access_tree}
        {sidebarWidth}
        value={scriptSegment}
      />
    </div>
  </div>
</else-if-block>
