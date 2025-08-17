<script lang="ts">
  import { createEventDispatcher } from "svelte";

  interface Props {
    selected?: boolean;
    text?: string;
  }

  let { selected = false, text = "" }: Props = $props();

  const dispatch = createEventDispatcher();

  function handleClick(e) {
    dispatch("click");
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<button
  onclick={handleClick}
  class="tab-button grid grid-cols-[auto_1fr_auto] group"
>
  <div class={selected ? "tab-left-triangle-selected" : "tab-left-triangle"}></div>

  <span class="{selected ? 'tab-inside-selected' : 'tab-inside'} truncate px-1"
    >{text}</span
  >

  <div
    class={selected ? "tab-right-triangle-selected" : "tab-right-triangle"}
></div>
</button>

<style>
  :root {
    --tab_color: #b33454;
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
</style>
