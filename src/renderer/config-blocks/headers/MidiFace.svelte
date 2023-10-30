<script>
  import { createEventDispatcher } from "svelte";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { onMount } from "svelte";
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
  class="{$$props.class} text-white flex items-center flex-row w-full"
  on:click={handleClick}
>
  <div class="flex flex-grow h-full pr-4">
    <div
      class="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1fr] grid-flow-col items-center flex-grow"
    >
      {#each Array(scriptSegments.length).keys() as i}
        <span class="text-center truncate p-2">{labels[i]}</span>
        <div
          class="bg-primary p-1 my-auto rounded items-center"
          on:click|stopPropagation
        >
          <LineEditor
            bind:value={scriptSegments[i]}
            {access_tree}
            disabled={true}
          />
        </div>
      {/each}
    </div>
  </div>
  <div class="ml-auto self-start grid grid-cols-[auto_1fr] -mr-[1px] -mt-[1px]">
    <div
      style="border-style: solid;
    border-width: 0 4px 15px 0;
    border-color: transparent {config.information
        .color} transparent transparent;"
    />

    <span
      style="background: {config.information.color};"
      class="pr-2 pl-1 italic text-sm">{config.information.blockTitle}</span
    >
  </div>
</div>
