<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";
  import { parenthesis } from "../validators";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { GridAction } from "../../runtime/runtime";

  export let config: GridAction;

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config) {
    scriptSegment = GridScript.humanize(config.script.slice(9));
  }

  function sendData(e) {
    const script = GridScript.shortify(e);

    dispatch("update-action", {
      short: `fst`,
      script: `function ${script}`,
      validationError: false,
    });
  }
</script>

<function-start-block
  class="px-2 w-full rounded-tr-xl flex text-white py-1 pointer-events-none"
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row items-center w-full">
    <span class="mr-4">Function</span>

    <div class="bg-secondary mr-1 rounded flex items-center flex-grow h-full">
      <LineEditor
        on:input={(e) => {
          const { script } = e.detail;
          sendData(script);
        }}
        on:change={() => dispatch("sync")}
        value={scriptSegment}
        availableCharacters={$config.parent.getAvailableChars()}
        restrictScopeTo={$config.parent.getInfo().element.type}
      />
    </div>
  </div>
</function-start-block>
