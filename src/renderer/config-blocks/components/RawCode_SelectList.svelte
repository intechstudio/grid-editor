<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import MoltenPushButton, {
    ButtonStyle,
  } from "../../main/panels/preferences/MoltenPushButton.svelte";

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
    <MoltenPushButton text={"Cancel"} on:click={handleCancel} />
    <MoltenPushButton
      text={"Replace"}
      style={ButtonStyle.ACCEPT}
      on:click={handleReplace}
    />
  </div>
</div>
