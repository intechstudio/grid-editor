<script lang="ts">
  // Untoggled zone block: its name, cells and what it sends ("f1 · 0,0 1×9 ·
  // CC 32 ch 1"), red when the zone has a problem, or a note when the line
  // isn't a zone line.
  import { createEventDispatcher } from "svelte";
  import { InfoBox } from "@intechstudio/grid-uikit";
  import type { GridAction, GridEvent } from "../../runtime/runtime";
  import { parseZone } from "../touch/zone-parse";
  import { zoneProblems, zoneSendProblem } from "../touch/zone-validate";
  import { zoneHeaderText } from "../touch/zone-blocks";
  import { zoneMidiLabel } from "../touch/zone-autos";
  import { Grid } from "../../lib/_utils";

  export let action: GridAction;

  const event = action.parent as GridEvent;

  const dispatch = createEventDispatcher();

  $: zone = parseZone($action.script);
  // The zones before this one count for the autos: the event is a
  // dependency (the extra arguments are only reactive dependencies).
  $: midi = zoneMidiOf($action, $event);
  function zoneMidiOf(..._dependencies: unknown[]) {
    return Grid.Auto.getZoneMidi(action);
  }
  $: summary =
    zone !== null
      ? zoneHeaderText(
          zone,
          typeof midi === "undefined" ? undefined : zoneMidiLabel(midi),
        )
      : "not a zone line";
  $: faulty =
    zone === null ||
    zoneProblems(zone).length > 0 ||
    typeof zoneSendProblem(
      $action.script,
      $event.config.map((e) => e.script),
    ) !== "undefined";

  function handleClick() {
    dispatch("toggle");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="flex items-center flex-row w-full pr-2" on:click={handleClick}>
  <div
    class="grid grid-cols-[auto_1fr_auto] gap-2 pl-2 items-center justify-center h-full w-full py-1"
  >
    <slot name="name" />
    <div class="justify-self-end" class:text-error={faulty} data-zone-summary>
      <InfoBox value={summary} />
    </div>
    <slot name="edit-name-trigger" />
  </div>
</div>
