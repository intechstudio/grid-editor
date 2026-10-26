<script lang="ts" context="module">
  import type { ActionBlockInformation } from "./ActionBlockInformation";
  import { touchStartInformation } from "./touch/zone-block-info";

  // No header: the face is always shown, so its warnings are seen.
  export const information: ActionBlockInformation = touchStartInformation;
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import {
    ElementType,
    EventType,
    EventTypeToNumber,
  } from "@intechstudio/grid-protocol";
  import type {
    GridAction,
    GridElement,
    GridEvent,
    GridPage,
  } from "../runtime/runtime";
  import { surfaceIssues, zoneSendProblem } from "./touch/zone-validate";
  import { libraryIssue } from "./touch/zone-library";

  export let action: GridAction;

  const event = action.parent as GridEvent;

  // The System Setup, where the Library block loads zona for the page.
  const page = (event.parent as GridElement).parent as GridPage;
  const systemSetup = page.control_elements
    .find((e) => e.type === ElementType.SYSTEM)
    ?.events.find((e) => e.type === EventTypeToNumber(EventType.SETUP));

  onMount(async () => {
    if (typeof systemSetup !== "undefined" && !systemSetup.isLoaded()) {
      await systemSetup.load();
    }
  });

  // Unknown until the System Setup is loaded: no warning before that.
  $: library =
    typeof $systemSetup !== "undefined" && systemSetup.isLoaded()
      ? libraryIssue($systemSetup.config.map((e) => e.script))
      : undefined;

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
