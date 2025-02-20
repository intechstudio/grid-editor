<script>
  import { createEventDispatcher } from "svelte";
  import { GridScript } from "@intechstudio/grid-protocol";

  export let config;
  export let index;

  import LineEditor from "../../main/user-interface/LineEditor.svelte";

  const dispatch = createEventDispatcher();

  let scriptSegment = ""; // local script part

  $: handleConfigChange($config);

  function handleConfigChange(config) {
    scriptSegment = GridScript.humanize(config.script.slice(7, -5));
  }

  function sendData(e) {
<<<<<<< Updated upstream
    if (parenthesis(e)) {
      const script = GridScript.shortify(e);

      dispatch("update-action", {
        short: "ei",
        script: `elseif ${script} then`,
      });
    }
=======
    const script = GridScript.shortify(e);

    dispatch("update-action", {
      short: "ei",
      script: `elseif ${script} then`,
    });
>>>>>>> Stashed changes
  }
</script>

<div
  class="px-2 w-full h-full flex text-white py-1 pointer-events-none"
  style="background-color:{config.information.color}"
>
  <div class="flex flex-row items-center w-full">
    <span class="mr-4">Else if</span>

    <div
      class="bg-secondary my-auto mr-1 rounded flex items-center flex-grow h-full"
    >
      <LineEditor
        on:input={(e) => {
          sendData(e.detail.script);
        }}
        on:change={() => dispatch("sync")}
        action={config}
        value={scriptSegment}
      />
    </div>
  </div>
</div>
