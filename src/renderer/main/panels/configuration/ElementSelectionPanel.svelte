<script>
  import MeltSelect from "./../preferences/MeltSelect.svelte";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { appSettings } from "../../../runtime/app-helper.store.js";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import {
    elementNameStore,
    runtime,
    user_input,
  } from "../../../runtime/runtime.store.js";

  function showControlElementNameOverlay() {
    if ($appSettings.displayedOverlay === "control-name-overlay") {
      $appSettings.displayedOverlay =
        typeof $appSettings.displayedOverlay === "undefined"
          ? "control-name-overlay"
          : undefined;
    } else {
      $appSettings.displayedOverlay = "control-name-overlay";
    }
  }

  function getElementName(value) {
    try {
      const { dx, dy } = $user_input;
      const obj = $elementNameStore[dx][dy];
      if (obj[value] === "") {
        return undefined;
      }

      return obj[value];
    } catch (e) {
      return undefined;
    }
  }

  let selected = -1;
  let elements = [{ title: "No Device", value: -1 }];

  $: handleSelectionChange(selected);

  function handleSelectionChange(value) {
    if (value === -1 || typeof value === "undefined") {
      return;
    }

    const ui = $user_input;
    user_input.set({
      dx: ui.dx,
      dy: ui.dy,
      pagenumber: ui.pagenumber,
      elementnumber: value,
      eventtype: ui.eventtype,
    });
  }

  $: {
    if ($user_input || $elementNameStore) {
      renderElementList();
    }
  }

  function renderElementList() {
    const ui = $user_input;
    const device = $runtime.find(
      (device) => device.dx === ui.dx && device.dy === ui.dy
    );
    if (typeof device === "undefined") {
      elements = [{ title: "No Device", value: -1 }];
      selected = -1;
      return;
    }
    const control_elements = device.pages.find(
      (page) => page.pageNumber === ui.pagenumber
    )?.control_elements;
    elements = control_elements.map((e) => {
      const stringName = getElementName(e.controlElementNumber);
      if (typeof stringName !== "undefined") {
        return { title: stringName, value: e.controlElementNumber };
      } else {
        return {
          title: `Element ${
            e.controlElementNumber < 255
              ? e.controlElementNumber
              : control_elements.length - 1
          } (${
            e.controlElementType[0].toUpperCase() +
            e.controlElementType.slice(1).toLowerCase()
          })`,
          value: e.controlElementNumber,
        };
      }
    });
    selected = ui.elementnumber;
  }
</script>

<div class="flex flex-col text-white">
  <div class="flex flex-row justify-between items-center py-1">
    <div class="flex flex-row items-center">
      <div class="text-gray-500 text-sm">Element Name</div>
      <TooltipQuestion
        key={"configuration_element_name"}
        class="ml-2 text-white "
      />
    </div>
    <div class="flex flex-row items-center gap-2">
      <span class="text-gray-500 text-sm">Element Name Overlay</span>
      <Toggle
        on:change={showControlElementNameOverlay}
        toggleValue={$appSettings.displayedOverlay === "control-name-overlay"}
      />
    </div>
  </div>
  {#key elements}
    <MeltSelect bind:target={selected} options={elements} />
  {/key}
</div>
