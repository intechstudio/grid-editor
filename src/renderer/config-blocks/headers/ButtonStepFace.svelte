<script lang="ts">
  import { ConfigObject } from "../../main/panels/configuration/Configuration.store";
  import { createEventDispatcher } from "svelte";
  import { toWords } from "number-to-words";

  const dispatch = createEventDispatcher();

  export let config: ConfigObject;
  export let index;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="px-2 w-full h-full {config.information.rounding === 'top'
    ? 'rounded-tr-xl'
    : ''} {config.information.rounding === 'bottom'
    ? 'rounded-br-xl'
    : ''} text-white flex items-center"
  style="background-color:{config.information.color}"
  on:click={handleClick}
>
  {#if config.information.short === "bstn"}
    <span
      >{`Step ${
        toWords(config.step)[0].toUpperCase() +
        toWords(config.step).slice(1).toLowerCase()
      }`}</span
    >
  {:else}
    <span>{config.information.displayName}</span>
  {/if}
</div>
