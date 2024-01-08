<script>
  import {
    elementNameStore,
    user_input,
    runtime,
    controlElementClipboard,
  } from "../../../runtime/runtime.store.js";

  import BtnAndPopUp from "../../user-interface/BtnAndPopUp.svelte";
  import { setTooltip } from "../../user-interface/tooltip/Tooltip.js";
  import SvgIcon from "../../user-interface/SvgIcon.svelte";
  import { createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import { ConfigTarget } from "./Configuration.store.js";
  import MeltRadio from "../preferences/MeltRadio.svelte";
  import { CEEAT } from "../../../protocol/grid-protocol.js";

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
      return new Event({
        name: String(
          Object.keys(CEEAT).find((key) => CEEAT[key].value == e.type)
        ),
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

  function handleCopyAll(e) {
    dispatch("copy-all");
  }

  function handleOverwriteAll(e) {
    dispatch("overwrite-all");
  }
</script>

<div class={$$props.class}>
  <div class="pb-2 flex flex-col justify-center">
    <div class="py-2 text-sm flex justify-between items-center">
      <div class="text-gray-500">Events</div>

      <div class="flex text-gray-400">
        <button
          use:setTooltip={{
            key: "configuration_copy_all",
            nowrap: true,
            instant: true,
            placement: "top",
            class: "p-4",
          }}
          class="relative px-2 py-1 mr-2 rounded-md group cursor-pointer bg-secondary border border-white border-opacity-5 hover:border-opacity-25"
          on:click={handleCopyAll}
        >
          <SvgIcon displayMode="button" iconPath={"copy_all"} />
        </button>

        <BtnAndPopUp
          class="relative px-2 py-1 rounded-md group cursor-pointer bg-secondary border border-white border-opacity-5 hover:border-opacity-25"
          enabled={typeof $controlElementClipboard !== "undefined"}
          on:clicked={handleOverwriteAll}
          tooltipKey={"configuration_overwrite"}
          btnStyle={`relative bg-secondary group rounded-md ${
            typeof $controlElementClipboard === "undefined"
              ? "hover:border-opacity-5"
              : "border-opacity-20"
          }`}
          popStyle={"bg-sencodary"}
        >
          <span slot="popup">Pasted!</span>
          <span slot="button">
            <SvgIcon
              class={typeof $controlElementClipboard === "undefined"
                ? "pointer-events-none opacity-60 group-hover:text-opacity-60 hover:text-opacity-60 text-opacity-60 text-white"
                : ""}
              iconPath={"paste_all"}
            />
          </span>
        </BtnAndPopUp>
      </div>
    </div>

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
                (e) => e.controlElementNumber == event.element
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
