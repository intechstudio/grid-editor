<script>
  import { createEventDispatcher } from "svelte";

  export let selected = false;
  export let text = "";

  const dispatch = createEventDispatcher();

  function handleClick(e) {
    dispatch("click");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  on:click={handleClick}
  class="tab-button grid grid-cols-[auto_1fr_auto] group"
>
  <div class={selected ? "tab-left-triangle-selected" : "tab-left-triangle"} />

  <span class="{selected ? 'tab-inside-selected' : 'tab-inside'} truncate px-1"
    >{text}</span
  >

  <div
    class={selected ? "tab-right-triangle-selected" : "tab-right-triangle"}
  />
</div>

<style global>
  :root {
    --tab_color: #372c32;
    --tab_selected_color: #da4167;
    --tab_hover_color: #7d3549;
  }

  .tab-button .tab-inside {
    background: var(--tab_color);
  }

  .tab-button .tab-left-triangle {
    border-style: solid;
    border-width: 0 4px 17px 0;
    border-color: transparent var(--tab_color) transparent transparent;
  }

  .tab-button .tab-right-triangle {
    border-style: solid;
    border-width: 17px 4px 0 0;
    border-color: var(--tab_color) transparent transparent transparent;
  }

  .tab-button:hover .tab-inside {
    background: var(--tab_hover_color);
  }

  .tab-button:hover .tab-left-triangle {
    border-style: solid;
    border-width: 0 4px 17px 0;
    border-color: transparent var(--tab_hover_color) transparent transparent;
  }

  .tab-button:hover .tab-right-triangle {
    border-style: solid;
    border-width: 17px 4px 0 0;
    border-color: var(--tab_hover_color) transparent transparent transparent;
  }

  .tab-button .tab-inside-selected {
    background: var(--tab_selected_color);
  }

  .tab-button .tab-left-triangle-selected {
    border-style: solid;
    border-width: 0 4px 17px 0;
    border-color: transparent var(--tab_selected_color) transparent transparent;
  }

  .tab-button .tab-right-triangle-selected {
    border-style: solid;
    border-width: 17px 4px 0 0;
    border-color: var(--tab_selected_color) transparent transparent transparent;
  }

  .atomicInput {
    padding-right: 0.5rem;
  }

  .atomicInput:first-child {
    padding-left: 0.5rem;
  }
</style>
