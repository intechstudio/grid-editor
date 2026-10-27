<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { touchStartInformation } from "./touch/zone-block-info";

  // No header: the face is always shown, so its warnings are seen.
  export const information: ActionBlockInformation = touchStartInformation;
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { EventType, NumberToEventType } from "@intechstudio/grid-protocol";
  import type {
    GridAction,
    GridElement,
    GridEvent,
    GridPage,
  } from "../runtime/runtime";
  import { globalsLoadedBefore } from "../lib/library";
  import { surfaceIssues, zoneSendProblem } from "./touch/zone-validate";
  import { libraryIssue } from "./touch/zone-library";

  export let action: GridAction;

  const event = action.parent as GridEvent;

  // The Setups the module runs before this one (System first, then the
  // elements), where a Library block may load zona for the page.
  const element = event.parent as GridElement;
  const page = element.parent as GridPage;
  const earlierSetups = page.control_elements
    .filter(
      (e) => e.elementIndex === 255 || e.elementIndex < element.elementIndex,
    )
    .flatMap((e) =>
      e.events.filter((s) => NumberToEventType(s.type) === EventType.SETUP),
    );

  let loaded = false;
  onMount(async () => {
    await Promise.all(
      earlierSetups.filter((e) => !e.isLoaded()).map((e) => e.load()),
    );
    loaded = true;
  });

  // Unknown until the earlier Setups are loaded: no warning before that.
  // Checked again when this Setup changes.
  $: library =
    loaded && $event ? libraryIssue(globalsLoadedBefore(action)) : undefined;

  $: scripts = $event.config.map((e) => e.script);
  $: issues = surfaceIssues(scripts);
  // Block order and the Library binding: shown here, don't stop the send.
  $: surface = [
    ...(typeof library !== "undefined" ? [library] : []),
    ...issues.filter((e) => typeof e.zone === "undefined"),
  ];
  // Duplicate names stop the send; other zone problems only show on the zone.
  $: blocking = scripts.filter(
    (e) => typeof zoneSendProblem(e, scripts) !== "undefined",
  ).length;
  $: zoneProblemCount = new Set(
    issues
      .filter((e) => e.level === "error" && typeof e.zone !== "undefined")
      .map((e) => e.zone),
  ).size;
</script>

<touch-start class="flex flex-col w-full px-4 py-2 gap-1 pointer-events-auto">
  <span class="text-sm text-gray-400">
    Starts the touch zones defined above it: touch input, MIDI receive, the
    first LED paint and the Touch Tick timer. New blocks from the picker go
    above it.
  </span>
  {#each surface as issue}
    <span
      class="text-sm"
      class:text-error={issue.level === "error"}
      class:text-warning={issue.level === "warning"}
      data-surface-issue={issue.level}>{issue.message}</span
    >
  {/each}
  {#if blocking > 0}
    <span class="text-sm text-error" data-surface-issue="error"
      >Zone names used twice: the Setup is not sent until they are renamed.</span
    >
  {:else if zoneProblemCount > 0}
    <span class="text-sm text-warning" data-surface-issue="warning"
      >{zoneProblemCount === 1
        ? "A zone has a problem: see its block."
        : `${zoneProblemCount} zones have problems: see their blocks.`}</span
    >
  {/if}
</touch-start>
