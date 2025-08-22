<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";
  import { ActionData, GridAction } from "../../runtime/runtime.js";
  import { InfoBox } from "@intechstudio/grid-uikit";
  import { Grid } from "../../lib/_utils.js";

  const dispatch = createEventDispatcher();

  export let config: GridAction;

  let scriptSegments: string[] = [];

  $: if (!$config.invalid) {
    handleConfigChange($config);
  }

  function handleConfigChange(config: ActionData) {
    scriptSegments = Script.toSegments({
      short: config.short,
      script: config.script,
    });
  }

  function handleClick(e) {
    dispatch("toggle");
  }
  function getDisplayValues(config: GridAction) {
    const segmentTypes = [
      Grid.Auto.Value.MIDI_CHANNEL,
      //Grid.Auto.Value.MIDI_COMMAND,
      Grid.Auto.Value.MIDI_P1,
    ] as const;

    return segmentTypes.map((e) => Grid.Auto.getMidi(config, e)).join(", ");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="flex items-center flex-row w-full pr-2"
  style="background-color: {config.information.color}"
  on:click={handleClick}
>
  <div class="grid grid-cols-[auto_1fr] items-center h-full w-full py-1">
    <span class="mr-2 w-fit whitespace-nowrap"
      >{config.information.displayName}</span
    >
    <InfoBox value={`${getDisplayValues(config)}`} />
  </div>
</div>
