<script lang="ts">
  import { user_input } from "./../../../runtime/user-input.store";
  import { get } from "svelte/store";
  import { MeltRadio } from "@intechstudio/grid-uikit";
  import {
    GridEvent,
    GridElement,
    ElementData,
  } from "../../../runtime/runtime";
  import { Grid } from "../../../lib/_utils";

  export let element: GridElement;

  type EventPanelOption = {
    title: string;
    value: number;
  };
  const defaultOptions: EventPanelOption[] = Array.from(Array(3).keys()).map(
    (i) => ({ title: undefined, value: i } as EventPanelOption)
  );

  const defaultSelected = -1;

  let options = defaultOptions;
  let selected = defaultSelected;

  $: handleElementChange($element);

  function handleElementChange(element: ElementData) {
    const ui = get(user_input);

    if (typeof element === "undefined") {
      options = defaultOptions;
      selected = defaultSelected;
      return;
    }

    options = element.events.map((e: GridEvent) =>
      Object({
        title: e.getName(),
        value: e.type,
      })
    );

    const closestEvent = Grid.getClosestEvent(
      options.map((e) => e.value),
      ui.eventtype
    );
    selected = closestEvent;
  }

  $: handleSelectEvent(selected);

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
</script>

<div class="m-4 pb-2 flex flex-col justify-center items-center relative">
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
        <unsaved-changes-marker
          class:hidden={!event?.hasChanges()}
          class="absolute right-0 top-0 w-4 h-4 bg-unsavedchange rounded-full translate-x-1/3 -translate-y-1/3"
        />
      {/key}
    </svelte:fragment>
  </MeltRadio>
</div>
