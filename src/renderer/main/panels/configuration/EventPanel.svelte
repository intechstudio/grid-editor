<script lang="ts">
  import { user_input } from "./../../../runtime/user-input.store";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { MeltRadio } from "@intechstudio/grid-uikit";
  import { EventType, EventTypeToNumber } from "@intechstudio/grid-protocol";
  import {
    GridEvent,
    GridElement,
    ElementData,
    GridPage,
    GridModule,
  } from "../../../runtime/runtime";
  import {
    listVirtualEvents,
    type VirtualEventDescriptor,
  } from "../../../runtime/virtual-event";
  import { Modal } from "../../modals/modal.store";
  import AddVirtualEvent from "../../modals/AddVirtualEvent.svelte";
  import { Grid } from "../../../lib/_utils";
  import { draggedActions } from "../../_actions/move.action";

  export let element: GridElement;

  type EventPanelOption = {
    title: string;
    value: number | string;
  };
  const defaultOptions: EventPanelOption[] = Array.from(Array(3).keys()).map(
    (i) => ({ title: undefined, value: i }) as EventPanelOption,
  );

  const defaultSelected = -1;
  const VIRTUAL_PREFIX = "virtual:";
  const virtualValue = (name: string) => `${VIRTUAL_PREFIX}${name}`;

  let options = defaultOptions;
  let selected: number | string = defaultSelected;
  let virtualEvents: VirtualEventDescriptor[] = [];
  let eventChangetimeout: NodeJS.Timeout = undefined;

  $: handleElementChange($element, $appSettings);

  function handleElementChange(element: ElementData) {
    const ui = get(user_input);

    if (typeof element === "undefined") {
      options = defaultOptions;
      selected = defaultSelected;
      virtualEvents = [];
      return;
    }

    const withoutSetupAndTimer = element.events.filter(
      (e) => e.getName() !== "Setup" && e.getName() !== "Timer",
    );

    const prefiltered =
      $appSettings.persistent.userLevelMinimalist === false ||
      withoutSetupAndTimer.length === 0
        ? element.events
        : withoutSetupAndTimer;

    const realOptions: EventPanelOption[] = prefiltered.map((e: GridEvent) =>
      Object({
        title: e.getName(),
        value: e.type,
      }),
    );

    const setup = element.events.find(
      (e) => e.type === EventTypeToNumber(EventType.SETUP),
    );
    virtualEvents = listVirtualEvents(setup);
    const virtualOptions: EventPanelOption[] = virtualEvents.map((d) => ({
      title: d.name,
      value: virtualValue(d.name),
    }));

    options = [...realOptions, ...virtualOptions];

    if (
      typeof ui.virtualEventName === "string" &&
      virtualEvents.some((d) => d.name === ui.virtualEventName)
    ) {
      selected = virtualValue(ui.virtualEventName);
      return;
    }

    const closestEvent = Grid.getClosestEvent(
      realOptions.map((e) => e.value as number),
      ui.eventtype,
    );
    selected = closestEvent;
  }

  $: handleSelectEvent(selected);

  function handleSelectEvent(value: number | string) {
    const ui = get(user_input);

    if (typeof value === "string" && value.startsWith(VIRTUAL_PREFIX)) {
      const name = value.slice(VIRTUAL_PREFIX.length);
      if (ui.virtualEventName === name) {
        return;
      }
      user_input.set({
        dx: ui.dx,
        dy: ui.dy,
        pagenumber: ui.pagenumber,
        elementnumber: ui.elementnumber,
        eventtype: EventTypeToNumber(EventType.SETUP),
        virtualEventName: name,
      });
      return;
    }

    if (value === -1 || (ui.eventtype === value && !ui.virtualEventName)) {
      return;
    }

    user_input.set({
      dx: ui.dx,
      dy: ui.dy,
      pagenumber: ui.pagenumber,
      elementnumber: ui.elementnumber,
      eventtype: value as number,
      virtualEventName: undefined,
    });
  }

  function handleAddVirtualEvent() {
    if (!element) {
      return;
    }
    new Modal.Window(AddVirtualEvent).show({
      element,
      existingNames: virtualEvents.map((d) => d.name),
    });
  }

  function handleMouseLeave() {
    clearTimeout(eventChangetimeout);
  }

  function handleMouseEnter(event: GridEvent) {
    if (options === defaultOptions || !event) {
      return;
    }

    const ui = get(user_input);
    const element = event.parent as GridElement;
    const page = element.parent as GridPage;
    const module = page.parent as GridModule;

    if (get(draggedActions).length === 0) {
      return;
    }

    if (
      ui.dx === module.dx &&
      ui.dy === module.dy &&
      ui.pagenumber === page.pageNumber &&
      ui.elementnumber === element.elementIndex &&
      ui.eventtype === event.type
    ) {
      return;
    }

    eventChangetimeout = setTimeout(() => {
      user_input.set({
        dx: module.dx,
        dy: module.dy,
        pagenumber: page.pageNumber,
        elementnumber: element.elementIndex,
        eventtype: event.type,
      });
    }, 100);
  }
</script>

<div class="flex flex-row w-full justify-center items-center gap-1 relative">
  <MeltRadio
    bind:target={selected}
    style="button"
    orientation="horizontal"
    size="full"
    {options}
  >
    <svelte:fragment slot="item" let:value>
      {@const event = element?.events.find((e) => e.type === Number(value))}
      {#key $element}
        <button
          class="absolute left-0 top-0 w-full h-full"
          on:mouseenter={() => handleMouseEnter(event)}
          on:mouseleave={handleMouseLeave}
          aria-label="Event preview"
        >
          <unsaved-changes-marker
            class:hidden={!event?.hasChanges()}
            class="absolute right-0 top-0 w-4 h-4 bg-unsavedchange rounded-full translate-x-1/3 -translate-y-1/3"
          ></unsaved-changes-marker>
        </button>
      {/key}
    </svelte:fragment>
  </MeltRadio>
  <button
    type="button"
    class="flex items-center justify-center shrink-0 w-6 h-6 rounded text-foreground-muted hover:text-foreground hover:bg-background-soft"
    on:click={handleAddVirtualEvent}
    title="Add virtual event"
    aria-label="Add virtual event"
  >
    +
  </button>
</div>
