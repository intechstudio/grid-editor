<script lang="ts">
  import { Grid } from "./../../../lib/_utils";
  import { NumberToEventType } from "@intechstudio/grid-protocol";
  import {
    runtime,
    user_input,
    type UserInputValue,
  } from "../../../runtime/runtime.store";

  import { get } from "svelte/store";
  import { MeltRadio } from "@intechstudio/grid-uikit";
  import { GridEvent, GridElement } from "../../../runtime/runtime";

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
  let target: GridElement;

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui: UserInputValue) {
    target = runtime.findElement(ui.dx, ui.dy, ui.pagenumber, ui.elementnumber);

    if (typeof target === "undefined") {
      options = defaultOptions;
      selected = defaultSelected;
      return;
    }

    options = target.events.map((e: GridEvent) =>
      Object({
        title: Grid.toFirstCase(NumberToEventType(e.type)),
        value: e.type,
      })
    );

    selected = options.find((e) => e.value === ui.eventtype).value;
  }

  $: handleSelectEvent(selected);

  function handleSelectEvent(value) {
    const ui = get(user_input);
    if (value === -1) {
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

<div class={$$props.class}>
  <div class="pb-2 flex flex-col justify-center">
    <div class="flex flex-col justify-center items-center">
      <MeltRadio
        bind:target={selected}
        style="button"
        orientation="horizontal"
        size="full"
        {options}
      >
        <svelte:fragment slot="item" let:value>
          {@const event = target?.events.find((e) => e.type === Number(value))}
          {#key $runtime}
            <unsaved-changes-marker
              class:hidden={!event?.hasChanges()}
              class="absolute right-0 top-0 w-4 h-4 bg-unsavedchange rounded-full translate-x-1/3 -translate-y-1/3"
            />
          {/key}
        </svelte:fragment>
      </MeltRadio>
    </div>
  </div>
</div>
