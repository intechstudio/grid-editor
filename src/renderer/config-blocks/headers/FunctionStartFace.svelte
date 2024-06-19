<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { parenthesis } from "../_validators";
  import { GridScript } from "grid-protocol";

  export let config;
  export let index;

  export let access_tree;

  import LineEditor from "../../main/user-interface/LineEditor.svelte";

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part

  let loaded = false;

  $: if (config.script && !loaded) {
    scriptSegment = GridScript.humanize(config.script.slice(9));
    loaded = true;
  }

  onDestroy(() => {
    loaded = false;
  });

  function sendData(e) {
    if (parenthesis(e)) {
      const script = GridScript.shortify(e);

      dispatch("output", {
        short: `fst`,
        script: `function ${script}`,
      });
    }
  }
</script>

<function-start-block
  class="{$$props.class} flex text-white py-2 pointer-events-none"
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row items-center w-full">
    <span class="mr-4">Function</span>

    <div class="bg-secondary mr-1 rounded flex items-center flex-grow h-full">
      <LineEditor
        on:change={(e) => {
          sendData(e.detail.script);
        }}
        {access_tree}
        value={scriptSegment}
      />
    </div>
  </div>
</function-start-block>
