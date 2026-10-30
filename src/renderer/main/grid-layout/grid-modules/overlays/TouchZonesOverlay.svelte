<script lang="ts">
  // The ZONA's touch zones in the control name overlay (docs/zona-touch-zones.md, Overlay): one
  // rectangle per zone line of the touch Setup, with its name, kind icon, group
  // badge and issue outline, highlighted while its block is selected.
  // Read-only: clicking a zone selects its block.
  import { tick } from "svelte";
  import { EventType, EventTypeToNumber } from "@intechstudio/grid-protocol";
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import type {
    GridElement,
    GridEvent,
    GridModule,
    GridPage,
  } from "../../../../runtime/runtime";
  import { selected_actions } from "../../../../runtime/selected-actions.store";
  import {
    type UserInputValue,
    user_input,
  } from "../../../../runtime/user-input.store";
  import { get } from "svelte/store";
  import { zoneIcon } from "../../../../config-blocks/touch/zone-block-info";
  import { type OverlayZone, overlayZones } from "./touch-zones";

  export let element: GridElement;
  // Keeps the labels upright on a rotated module (as the element names do).
  export let labelRotation = 0;

  const SETUP = EventTypeToNumber(EventType.SETUP);

  // The Setup of the element shown now: Device.svelte passes a new element
  // when the page changes, and the overlay is reused.
  $: setup = element.events.find((e) => e.type === SETUP);

  // Loads the Setup when it isn't loaded: first open, a page change, or a
  // discard that unloaded the page while another event was shown. One load
  // per event at a time; after a failed one, a later change of the event's
  // store tries again, but not within RETRY_MS, so a load that keeps failing
  // can't loop.
  const RETRY_MS = 2000;
  const loading = new Set<GridEvent>();
  const failedAt = new Map<GridEvent, number>();

  $: if (typeof setup !== "undefined" && $setup && !setup.isLoaded()) {
    load(setup);
  }

  async function load(event: GridEvent) {
    const failed = failedAt.get(event);
    if (
      loading.has(event) ||
      (typeof failed !== "undefined" && Date.now() - failed < RETRY_MS)
    ) {
      return;
    }
    loading.add(event);
    try {
      await event.load();
      failedAt.delete(event);
    } catch {
      failedAt.set(event, Date.now()); // not readable now (busy, page change)
    } finally {
      loading.delete(event);
    }
  }

  $: zones =
    typeof setup !== "undefined" && $setup
      ? overlayZones(
          setup.config,
          $selected_actions.map((e) => e.id),
        )
      : [];

  // Whether the config panel shows this Setup already.
  function isShown(event: GridEvent): boolean {
    const element = event.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;
    const current: UserInputValue = get(user_input);
    return (
      current.dx === module.dx &&
      current.dy === module.dy &&
      current.pagenumber === page.pageNumber &&
      current.elementnumber === element.elementIndex &&
      current.eventtype === event.type
    );
  }

  // Selects the zone's block; the touch Setup is shown first when it isn't
  // (displayEvent clears the selection and waits a frame, so it is set after).
  async function select(zone: OverlayZone) {
    const event = setup;
    const action = event?.config.find((e) => e.id === zone.actionId);
    if (typeof event === "undefined" || typeof action === "undefined") {
      return;
    }
    if (!isShown(event)) {
      await user_input.displayEvent(event);
      await tick();
    }
    selected_actions.set([action]);
  }
</script>

<touch-zones class="absolute inset-0 pointer-events-auto">
  {#each zones as zone (`${zone.actionId}:${zone.index}`)}
    <button
      class="zone absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden"
      class:highlighted={zone.highlighted}
      class:error={zone.issue === "error"}
      class:warning={zone.issue === "warning"}
      style="left: {zone.rect.left}%; top: {zone.rect.top}%; width: {zone.rect
        .width}%; height: {zone.rect.height}%;"
      data-zone={zone.zone.name}
      data-issue={zone.issue ?? ""}
      data-highlighted={zone.highlighted}
      title={`${zone.zone.name} (${zone.zone.kind})`}
      on:click|stopPropagation={() => select(zone)}
    >
      <div
        class="flex flex-col items-center"
        style="transform: rotate({labelRotation}deg);"
      >
        <div class="icon [&_svg]:stroke-current">
          <SvgIcon scale={0.9} iconData={zoneIcon(zone.zone)} />
        </div>
        <span class="name">{zone.zone.name}</span>
      </div>
      {#if typeof zone.group !== "undefined"}
        <span
          class="badge absolute top-0.5 right-0.5"
          style="transform: rotate({labelRotation}deg);"
          data-group={zone.group}>G{zone.group}</span
        >
      {/if}
    </button>
  {/each}
</touch-zones>

<style>
  .zone {
    border: 1px solid color-mix(in srgb, var(--foreground) 55%, transparent);
    background-color: color-mix(in srgb, var(--overlay-bg) 75%, transparent);
    color: var(--foreground);
    border-radius: 3px;
    font-size: 0.85em;
    line-height: 1;
  }
  .zone:hover {
    border-color: var(--foreground);
  }
  /* the editor palette (tailwind pick, warning, error) */
  .zone.highlighted {
    border: 2px solid #6b7aff;
    background-color: color-mix(in srgb, #6b7aff 25%, transparent);
  }
  .zone.warning {
    outline: 2px solid #eab308;
    outline-offset: -3px;
  }
  .zone.error {
    outline: 2px solid #dc2626;
    outline-offset: -3px;
  }
  .name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    font-size: 0.75em;
    padding: 0 3px;
    border-radius: 3px;
    background-color: color-mix(in srgb, var(--foreground) 20%, transparent);
  }
</style>
