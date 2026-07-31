<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Script } from "../_script_parsers.js";
  import {
    ActionData,
    GridAction,
    GridElement,
    GridEvent,
    GridPage,
  } from "../../runtime/runtime.js";
  import { moduleMidiChannelState } from "../../runtime/system-midi-channel";
  import { InfoBox } from "@intechstudio/grid-uikit";
  import { Grid } from "../../lib/_utils.js";
  import {
    getCommand,
    getParameterNames,
    MusicalNotes,
  } from "../../main/panels/MidiMonitor/MidiMonitor.store.js";

  const dispatch = createEventDispatcher();

  export let action: GridAction;

  // Reactive, config-derived module MIDI channel for this action's page, so the
  // preview's auto channel value updates live when the page default changes.
  const channelStore = moduleMidiChannelState(
    ((action.parent as GridEvent)?.parent as GridElement)?.parent as
      | GridPage
      | undefined,
  );

  let scriptSegments: string[] = [];

  $: if (!$action.invalid) {
    handleActionChange($action);
  }

  // Depend on $channelStore too so a change to the page's module channel
  // re-renders the preview (getDisplayValues reads it via getMidiChannelLabel).
  $: channelPreview = ($channelStore, getDisplayValues($action));

  function handleActionChange(data: ActionData) {
    scriptSegments = Script.toSegments({
      short: data.short,
      script: data.script,
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
    ).map((e, i) => {
      if (scriptSegments[i] !== "-1") {
        return scriptSegments[i];
      }
      // Auto: for the channel, surface "Expression" when the module's
      // midi_auto_ch is hand-written — a resolved number would be misleading.
      return e === Grid.Auto.Value.MIDI_CHANNEL
        ? Grid.Auto.getMidiChannelLabel(action)
        : Grid.Auto.getMidi(action, e);
    });

    if (!isNaN(+segments[0])) {
      segments[0] = +segments[0] + 1;
    }

    if (!isNaN(+segments[1])) {
      const commandName = getCommand(+segments[1]).name;
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
  style=""
  on:click={handleClick}
>
  <div
    class="grid grid-cols-[auto_1fr_auto] gap-2 pl-2 items-center justify-center h-full w-full py-1"
  >
    <slot name="name" />
    <div class="justify-self-end">
      <InfoBox value={channelPreview} />
    </div>
    <slot name="edit-name-trigger" />
  </div>
</div>
