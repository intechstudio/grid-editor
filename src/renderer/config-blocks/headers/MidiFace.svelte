<script>
  import { createEventDispatcher } from "svelte";
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { onMount } from "svelte";
  import { Script } from "../_script_parsers.js";

  const dispatch = createEventDispatcher();

  export let access_tree;
  export let config = undefined;

  let scriptSegments = ["", "", "", ""];

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
  class="{$$props.class} text-white flex items-center flex-row w-full gap-4 pl-2"
  on:click={handleClick}
>
  <div class="flex flex-row items-center gap-2">
    <span>Command:</span>
    <div
      class="bg-primary p-1 my-auto rounded flex items-center w-10 h-full"
      on:click|stopPropagation
    >
      <LineEditor
        bind:value={scriptSegments[1]}
        {access_tree}
        disabled={true}
      />
    </div>
  </div>
  <div class="flex flex-row items-center gap-2">
    <span>Value:</span>
    <div
      class="bg-primary p-1 my-auto rounded flex items-center w-10 h-full"
      on:click|stopPropagation
    >
      <LineEditor
        bind:value={scriptSegments[2]}
        {access_tree}
        disabled={true}
      />
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
      class="pr-2 pl-1 italic text-sm truncate"
      >{config.information.blockTitle}</span
    >
  </div>
</div>
