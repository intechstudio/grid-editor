<script>
  import LineEditor from "../../main/user-interface/LineEditor.svelte";
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";

  export let access_tree;
  export let config = undefined;

  const dispatch = createEventDispatcher();

  let displayValue = "?";

  $: handleScriptChange(config.script);

  function handleScriptChange(script) {
    let segments = Script.toSegments({ script });
    const [start, end, inc] = segments.slice(1);
    displayValue = String(
      Math.floor((Math.abs(start - end) + 1) / Math.abs(inc))
    );
  }

  function handleClick(e) {
    dispatch("toggle");
  }

  function sendData({ value }) {
    dispatch("output", {
      short: config.information.short,
      script: `for i=1,${value},1 do`,
    });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<for-loop-header class="{$$props.class} text-white" on:click={handleClick}>
  <div class="flex flex-row w-full h-full items-center gap-2">
    <span>Repeat for</span>
    <div
      class="bg-secondary p-1 my-auto rounded flex items-center w-10"
      on:click|stopPropagation
    >
      <LineEditor
        on:change={(e) => {
          sendData({ value: e.detail.script });
        }}
        {access_tree}
        bind:value={displayValue}
      />
    </div>
    <span>times</span>
    <div class="ml-auto min-w-[10px] opacity-50 mr-1 cursor-pointer">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 4 18 10"
        class="fill-black"
        ><g stroke-width="0" /><g
          stroke-linecap="round"
          stroke-linejoin="round"
        /><g id="SVGRepo_iconCarrier">
          <path
            d="M17.707 5.707l-8 8a1 1 0 0 1-1.414 0l-8-8A1 1 0 0 1 1 4h16a1 1 0 0 1 .924.617A.97.97 0 0 1 18 5a1 1 0 0 1-.293.707z"
          />
        </g></svg
      >
    </div>
  </div>
</for-loop-header>
