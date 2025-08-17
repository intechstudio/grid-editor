<script lang="ts">
  import { run } from 'svelte/legacy';

  import { user_input } from "./../../../runtime/user-input.store";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { get } from "svelte/store";
  import { MeltRadio } from "@intechstudio/grid-uikit";
  import {
    GridEvent,
    GridElement,
    ElementData,
    GridPage,
    GridModule,
  } from "../../../runtime/runtime";
  import { Grid } from "../../../lib/_utils";
  import { draggedActions } from "../../_actions/move.action";

  interface Props {
    element: GridElement;
  }

  let { element }: Props = $props();

  type EventPanelOption = {
    title: string;
    value: number;
  };
  const defaultOptions: EventPanelOption[] = Array.from(Array(3).keys()).map(
    (i) => ({ title: undefined, value: i }) as EventPanelOption,
  );

  const defaultSelected = -1;

  let options = $state(defaultOptions);
  let selected = $state(defaultSelected);
  let eventChangetimeout: NodeJS.Timeout = undefined;


  function handleElementChange(element: ElementData) {
    const ui = get(user_input);

    if (typeof element === "undefined") {
      options = defaultOptions;
      selected = defaultSelected;
      return;
    }

    const prefiltered = element.events.filter(
      (e) =>
        (e.getName() !== "Setup" && e.getName() !== "Timer") ||
        $appSettings.persistent.userLevelMinimalist === false,
    );

    options = prefiltered.map((e: GridEvent) =>
      Object({
        title: e.getName(),
        value: e.type,
      }),
    );

    const closestEvent = Grid.getClosestEvent(
      options.map((e) => e.value),
      ui.eventtype,
    );
    selected = closestEvent;
  }


  function handleSelectEvent(value: any) {
    const ui = get(user_input);
    if (value === -1 || ui.eventtype === value) {
      return;
    }

    user_input.set({
      dx: ui.dx,
      dy: ui.dy,
      pagenumber: ui.pagenumber,
      elementnumber: ui.elementnumber,
      eventtype: selected,
    });
  }

  function handleMouseLeave() {
    clearTimeout(eventChangetimeout);
  }

  function handleMouseEnter(event: GridEvent) {
    if (options === defaultOptions) {
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
  run(() => {
    handleElementChange($element, $appSettings);
  });
  run(() => {
    handleSelectEvent(selected);
  });
</script>

<div class="p-2 flex flex-col justify-center items-center relative">
  <MeltRadio
    bind:target={selected}
    style="button"
    orientation="horizontal"
    size="full"
    {options}
  >
    {#snippet item({ value })}
      
        {@const event = element?.events.find((e) => e.type === Number(value))}
        {#key $element}
          <button
            class="absolute left-0 top-0 w-full h-full"
            onmouseenter={() => handleMouseEnter(event)}
            onmouseleave={handleMouseLeave}
          >
            <unsaved-changes-marker
              class:hidden={!event?.hasChanges()}
              class="absolute right-0 top-0 w-4 h-4 bg-unsavedchange rounded-full translate-x-1/3 -translate-y-1/3"
></unsaved-changes-marker>
          </button>
        {/key}
      
      {/snippet}
  </MeltRadio>
</div>
