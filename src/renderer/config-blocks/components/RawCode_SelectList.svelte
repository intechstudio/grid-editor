<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { MeltSelect } from "@intechstudio/grid-uikit";

  export let options = [];

  let selection = options[0].value;

  const dispatch = createEventDispatcher();

  function handleCancel(e) {
    dispatch("event", { type: "close" });
  }

  function handleReplace(e) {
    dispatch("event", { type: "replace", data: { short: selection } });
  }
</script>

<div class="{$$props.class} text-white">
  <div class="text-left">Some stuff happened...</div>
  {#if options.length > 0}
    <MeltSelect bind:target={selection} {options} />
  {/if}
  <div class="flex flex-row gap-2">
    <button
      class="px-2 py-1 rounded bg-select text-white hover:bg-select-saturate-20 flex flex-grow justify-center"
      on:click={handleCancel}>Cancel</button
    >
    <button
      class="px-2 py-1 rounded bg-commit text-white hover:bg-commit-saturate-20 flex flex-grow justify-center"
      on:click={handleReplace}>Replace</button
    >
  </div>
</div>
