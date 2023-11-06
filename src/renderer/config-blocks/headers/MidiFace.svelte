<script>
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";

  const dispatch = createEventDispatcher();

  export let access_tree;
  export let config = undefined;

  let scriptSegments = ["", "", "", ""];
  let labels = ["CH:", "CMD:", "P1:", "P2:"];

  $: handleConfigChange(config);

  function handleConfigChange(config) {
    scriptSegments = Script.toSegments({
      short: config.short,
      script: config.script,
    });
  }

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="{$$props.class} text-white flex items-center flex-row w-full px-2"
  on:click={handleClick}
>
  <div class="flex flex-row items-center flex-grow h-full w-full">
    <span class="mr-2">{config.information.blockTitle}</span>
    <div
      class="bg-primary p-1 my-auto rounded items-center flex flex-grow"
      on:click|stopPropagation
    >
      {#each Array(scriptSegments.length).keys() as i}
        <span class="text-center truncate mx-1">{labels[i]}</span>

        <span class="mr-2">
          {scriptSegments[i]}
        </span>
      {/each}
    </div>
  </div>
</div>
