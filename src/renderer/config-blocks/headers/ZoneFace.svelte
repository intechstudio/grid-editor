<script lang="ts">
  // Untoggled zone block: its name and cells ("f1 · 0,0 1×9"), red when the
  // zone has a problem, or a note when the line isn't a zone line.
  import { createEventDispatcher } from "svelte";
  import { InfoBox } from "@intechstudio/grid-uikit";
  import type { GridAction } from "../../runtime/runtime";
  import { parseZone } from "../touch/zone-parse";
  import { zoneProblems } from "../touch/zone-validate";
  import { zoneHeaderText } from "../touch/zone-blocks";

  export let action: GridAction;

  const dispatch = createEventDispatcher();

  $: zone = parseZone($action.script);
  $: summary = zone !== null ? zoneHeaderText(zone) : "not a zone line";
  $: faulty = zone === null || zoneProblems(zone).length > 0;

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
