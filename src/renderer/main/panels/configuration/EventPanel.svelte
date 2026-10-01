<script lang="ts">
  import { user_input } from "./../../../runtime/user-input.store";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { MeltRadio, IconButton } from "@intechstudio/grid-uikit";
  import addIcon from "../../../assets/icons/add.svg?raw";
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
    getVirtualEvent,
    getVirtualEventBlock,
    type VirtualEventDescriptor,
  } from "../../../runtime/virtual-event";
  import { Modal } from "../../modals/modal.store";
  import AddVirtualEvent from "../../modals/AddVirtualEvent.svelte";
  import { Grid } from "../../../lib/_utils";
  import { draggedActions } from "../../_actions/move.action";
  import { removeActions } from "../../../runtime/operations";
  import { tooltip } from "../../_actions/tooltip";

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
  let setupEvent: GridEvent | undefined;
  let eventChangetimeout: NodeJS.Timeout = undefined;

  $: handleElementChange($element, $appSettings);

  function handleElementChange(element: ElementData) {
    const ui = get(user_input);

    if (typeof element === "undefined") {
      options = defaultOptions;
      selected = defaultSelected;
      virtualEvents = [];
      setupEvent = undefined;
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
    setupEvent = setup;
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

  $: isVirtualSelected =
    typeof selected === "string" && selected.startsWith(VIRTUAL_PREFIX);

  function handleRemoveVirtualEvent() {
    if (typeof selected !== "string" || !selected.startsWith(VIRTUAL_PREFIX)) {
      return;
    }
    const name = selected.slice(VIRTUAL_PREFIX.length);
    const descriptor = virtualEvents.find((d) => d.name === name);
    const setup = element?.events.find(
      (e) => e.type === EventTypeToNumber(EventType.SETUP),
    );
    if (!descriptor || !setup) {
      return;
    }
    removeActions(setup, ...getVirtualEventBlock(setup, descriptor.fstAction));
  }

  // The MeltRadio item's own `event` const only resolves real events
  // (`element.events.find((e) => e.type === Number(value))`) — a virtual
  // tab's value is a "virtual:name" string, so Number(value) is NaN and
  // `event` comes back undefined there. Resolve the matching VirtualGridEvent
  // instead and use its own hasChanges(), which is scoped to just that
  // function's fst..fen block — not setupEvent.hasChanges(), which would
  // light up every virtual tab whenever anything else changed on Setup.
  function optionHasChanges(
    value: number | string,
    event: GridEvent | undefined,
  ): boolean {
    if (event) {
      return event.hasChanges();
    }
    if (
      typeof value === "string" &&
      value.startsWith(VIRTUAL_PREFIX) &&
      setupEvent
    ) {
      const name = value.slice(VIRTUAL_PREFIX.length);
      const descriptor = virtualEvents.find((d) => d.name === name);
      return descriptor
        ? getVirtualEvent(setupEvent, descriptor.fstAction).hasChanges()
        : false;
    }
    return false;
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
            class:hidden={!optionHasChanges(value, event)}
            class="absolute right-0 top-0 w-4 h-4 bg-unsavedchange rounded-full translate-x-1/3 -translate-y-1/3"
          ></unsaved-changes-marker>
        </button>
      {/key}
    </svelte:fragment>
  </MeltRadio>
  <IconButton
    on:click={handleAddVirtualEvent}
    iconData={addIcon}
    compact
    tooltipText="Add virtual event"
    ariaLabel="Add virtual event"
  />
  {#if isVirtualSelected}
    <div
      use:tooltip={{
        text: "Remove this virtual event?",
        placement: "top",
        class: "w-60 p-4",
        buttons: [
          { label: "Cancel", handler: undefined },
          { label: "Confirm", handler: handleRemoveVirtualEvent },
        ],
        triggerEvents: ["show-buttons", "hover"],
      }}
    >
      <IconButton
        on:click={() => {}}
        iconPath="remove"
        compact
        ariaLabel="Remove virtual event"
      />
    </div>
  {/if}
</div>
