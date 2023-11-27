<script>
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { createEventDispatcher } from "svelte";
  import { appSettings } from "../../../../runtime/app-helper.store";

  export let device = undefined;
  export let visible = false;
  export let elementNumber = undefined;

  const dispatch = createEventDispatcher();

  let type = undefined;
  $: {
    type = device?.pages[0].control_elements[elementNumber]?.controlElementType;
  }

  function handleClick(e) {
    dispatch("click", { elementNumber: elementNumber });
  }
</script>

{#if visible && $selectedConfigStore.type === type}
  <button
    on:click={handleClick}
    class="group rounded bg-opacity-10 bg-white hover:bg-commit hover:bg-opacity-90 focus:outline-none {$$props.class}"
    style="{$$props.style}; transform: rotate({-$appSettings.persistent
      .moduleRotation}deg);"
  >
    <span class="hidden group-hover:block text-white">Load</span>
  </button>
{/if}
