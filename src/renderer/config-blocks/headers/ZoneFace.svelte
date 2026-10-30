<script lang="ts">
  // Untoggled zone block: its first zone's name, cells and what it sends
  // ("f1 · 0,0 1×9 · CC 32 ch 1") next to its colour, with "+2 zones" when it
  // defines more, red when a zone has a problem, or a note when the script
  // isn't zone lines.
  import { createEventDispatcher } from "svelte";
  import { InfoBox } from "@intechstudio/grid-uikit";
  import type { GridAction, GridEvent } from "../../runtime/runtime";
  import { parseZones } from "../touch/zone-parse";
  import { zoneProblems, zoneSendProblem } from "../touch/zone-validate";
  import { zoneHeaderText } from "../touch/zone-blocks";
  import { zoneOutputLabel } from "../touch/zone-autos";
  import { Grid } from "../../lib/_utils";

  export let action: GridAction;

  const event = action.parent as GridEvent;

  const dispatch = createEventDispatcher();

  $: zones = parseZones($action.script);
  $: zone = zones?.[0] ?? null;
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
          typeof midi === "undefined" ? undefined : zoneOutputLabel(zone, midi),
        ) + (zones!.length > 1 ? ` · +${zones!.length - 1} more` : "")
      : "not a zone line";
  // "red,green,blue,alpha"; a channel at -1 is the module's colour, not known here
  $: colour =
    typeof zone?.opt.col === "string" &&
    /^\d+,\d+,\d+,[\d.]+$/.test(zone.opt.col)
      ? `rgba(${zone.opt.col})`
      : undefined;
  $: faulty =
    zones === null ||
    zones.some((e) => zoneProblems(e).length > 0) ||
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
    <div
      class="justify-self-end flex flex-row items-center gap-2"
      class:text-error={faulty}
      data-zone-summary
    >
      {#if colour}
        <span
          class="w-3 h-3 rounded-full border border-black"
          style="background-color: {colour};"
          data-zone-colour={colour}
        ></span>
      {/if}
      <InfoBox value={summary} />
    </div>
    <slot name="edit-name-trigger" />
  </div>
</div>
