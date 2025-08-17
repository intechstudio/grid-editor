<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../../runtime/runtime";
  const dispatch = createEventDispatcher();

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="px-2 w-full {config.information.rounding === 'top'
    ? 'rounded-tr-xl'
    : ''} {config.information.rounding === 'bottom'
    ? 'rounded-br-xl'
    : ''} text-white flex items-center"
  style="background-color:{config.information.color}"
  onclick={handleClick}
>
  <span>{config.information.displayName}</span>
</div>
