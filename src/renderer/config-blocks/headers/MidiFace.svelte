<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";
  import { ActionData, GridAction } from "../../runtime/runtime.js";
  import { InfoBox } from "@intechstudio/grid-uikit";
  import { Grid } from "../../lib/_utils.js";
  import {
    getCommand,
    getParameterNames,
    MusicalNotes,
  } from "../../main/panels/MidiMonitor/MidiMonitor.store.js";

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
  function getDisplayValues(obj: ActionData) {
    const segments = (
      [
        Grid.Auto.Value.MIDI_CHANNEL,
        Grid.Auto.Value.MIDI_COMMAND,
        Grid.Auto.Value.MIDI_P1,
      ] as const
    ).map((e, i) =>
      scriptSegments[i] === "-1"
        ? Grid.Auto.getMidi(config, e)
        : scriptSegments[i],
    );

    if (!isNaN(+segments[1])) {
      const commandName = getCommand(+segments[1]).short;
      const params = getParameterNames(+segments[1]);
      segments[1] = commandName;

      if (params.p1.name === "Note" && !isNaN(+segments[2])) {
        const note = MusicalNotes.FromInt(+segments[2]);
        segments[2] = note;
      }
    }

    return `Ch: ${segments[0]}, ${segments[1]}, ${segments[2]}`;
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
    <InfoBox value={`${getDisplayValues($config)}`} />
  </div>
</div>
