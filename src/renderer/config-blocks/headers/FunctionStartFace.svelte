<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";

  export let config;
  export let index;

  import LineEditor from "../../main/user-interface/LineEditor.svelte";

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part

  $: handleConfigChange($config);

  function handleConfigChange(config) {
    scriptSegment = GridScript.humanize(config.script.slice(9));
  }

  function sendData(e) {
    const script = GridScript.shortify(e);

    dispatch("update-action", {
      short: `fst`,
      script: `function ${script}`,
    });
  }
</script>

<function-start-block
  class="px-2 w-full h-full rounded-tr-xl flex text-white py-1 pointer-events-none"
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row items-center w-full">
    <span class="mr-4">Function</span>

    <div class="bg-secondary mr-1 rounded flex items-center flex-grow h-full">
      <LineEditor
        on:input={(e) => {
          sendData(e.detail.script);
        }}
        on:change={() => dispatch("sync")}
        value={scriptSegment}
        availableCharacters={$config.parent.getAvailableChars()}
      />
    </div>
  </div>
</function-start-block>
