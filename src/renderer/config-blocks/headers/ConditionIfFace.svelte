<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { parenthesis } from "../_validators";

  export let config;
  export let index;

  export let access_tree;

  import LineEditor from "../../main/user-interface/LineEditor.svelte";

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
        short: `if`,
        script: `if ${script} then`,
      });
    }
  }
</script>

<if-block
  class="{$$props.class} h-fit flex text-white py-1 pointer-events-none"
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row items-center w-full">
    <span class="mr-4">If</span>

    <div
      class="bg-secondary my-auto mr-1 rounded flex items-center flex-grow h-full"
    >
      <LineEditor
        on:change={(e) => {
          sendData(e.detail.script);
        }}
        {access_tree}
        value={scriptSegment}
      />
    </div>
    <span class="mx-3">Then</span>
  </div>
</if-block>
