<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";
  import { GridAction } from "../../runtime/runtime.js";
  import { InfoBox } from "@intechstudio/grid-uikit";

  const dispatch = createEventDispatcher();

  interface Props {
    config: GridAction;
  }

  let { config }: Props = $props();

  let scriptSegments = $state([]);


  function handleConfigChange(config) {
    scriptSegments = Script.toSegments({
      short: config.short,
      script: config.script,
    });
  }

  function handleClick(e) {
    dispatch("toggle");
  }
  run(() => {
    if (!$config.invalid) {
      handleConfigChange($config);
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
  class="flex items-center flex-row w-full px-2 bg-background-muted"
  onclick={handleClick}
>
  <div class="grid grid-cols-[auto_1fr] items-center h-full w-full py-1">
    <span class="mr-2 w-fit whitespace-nowrap"
      >{config.information.displayName}</span
    >
    <InfoBox value={`(${scriptSegments.join(", ")})`} />
  </div>
</div>
