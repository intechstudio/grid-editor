<script>
  import { user_input, runtime } from "../../../runtime/runtime.store.js";

  import { createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import { ConfigTarget } from "./Configuration.store";
  import { MeltRadio } from "@intechstudio/grid-uikit";
  import { CEEAT } from "grid-protocol";

  const dispatch = createEventDispatcher();

  class Event {
    constructor({
      name = "",
      type = -1,
      selected = false,
      dx,
      dy,
      element,
      page,
    }) {
      this.name = name;
      this.type = type;
      this.selected = selected;
      this.dx = dx;
      this.dy = dy;
      this.element = element;
      this.page = page;
    }
  }

  let options = [];
  let selected = -1;

  let events = [];

  $: handleUserInputChange($user_input);

  function handleUserInputChange(ui) {
    const target = ConfigTarget.createFrom({ userInput: ui });

    if (typeof target === "undefined") {
      options = Array.from(Array(3).keys()).map((i) =>
        Object({ title: undefined, value: i })
      );
      selected = -1;
      return;
    }

    //Get events
    events = target.events.map((e) => {
      const name = String(
        Object.values(CEEAT).find((obj) => obj.value == e.type).desc
      );
      return new Event({
        name: name[0].toUpperCase() + name.slice(1).toLowerCase(),
        type: Number(e.type),
        dx: target.device.dx,
        dy: target.device.dy,
        element: target.element,
        page: target.page,
      });
    });
    options = events.map((e, i) => Object({ title: e.name, value: i }));
    selected = events.findIndex((e) => Number(target.eventType) === e.type);
  }

  $: handleSelectEvent(selected);

  function handleSelectEvent(value) {
    const event = events[value];
    if (typeof event === "undefined") {
      return;
    }
    const ui = get(user_input);
    user_input.set({
      dx: ui.dx,
      dy: ui.dy,
      pagenumber: ui.pagenumber,
      elementnumber: ui.elementnumber,
      eventtype: event.type,
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
          {@const event = events[value]}
          {#if typeof event !== "undefined"}
            {@const eventData = $runtime
              .find((e) => e.dx == event.dx && e.dy == event.dy)
              ?.pages[event.page].control_elements.find(
                (element) => element.elementIndex == event.element
              )
              ?.events.find((e) => e.type == event.type)}
            {@const stored = eventData?.stored}
            {@const config = eventData?.config}
            {#if stored !== config && typeof stored !== "undefined"}
              <unsaved-changes-marker
                class="absolute right-0 top-0 w-4 h-4 bg-unsavedchange rounded-full translate-x-1/3 -translate-y-1/3"
              />
            {/if}
          {/if}
        </svelte:fragment>
      </MeltRadio>
    </div>
  </div>
</div>
