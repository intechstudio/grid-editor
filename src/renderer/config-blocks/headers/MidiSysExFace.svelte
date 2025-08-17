<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { GridAction } from "../../runtime/runtime";
  import { InfoBox } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  const whatsInParenthesis = /\(([^)]+)\)/;

  function handleClick(e) {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
  class="flex items-center flex-row w-full px-2 bg-background-muted"
  onclick={handleClick}
>
  <div class="grid grid-cols-[auto_1fr] items-center h-full w-full my-1">
    <span class="mr-2 w-fit whitespace-nowrap"
      >{config.information.displayName}</span
    >
    <InfoBox value={whatsInParenthesis.exec($config.script)[0]} />
  </div>
</div>
