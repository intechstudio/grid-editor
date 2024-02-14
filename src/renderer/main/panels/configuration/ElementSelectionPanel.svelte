<script>
  import { get } from "svelte/store";
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { moduleOverlay } from "../../../runtime/moduleOverlay";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import {
    elementNameStore,
    runtime,
    user_input,
  } from "../../../runtime/runtime.store.js";

  function showControlElementNameOverlay() {
    const show = get(moduleOverlay) !== "control-name-overlay";
    if (show) {
      moduleOverlay.show("control-name-overlay");
    } else {
      moduleOverlay.close();
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

  let selectedElementNumber = -1;
  let options = [{ title: "No Device", value: -1 }];

  $: handleSelectedChange(selectedElementNumber);

  function handleSelectedChange(elementNumber) {
    if (elementNumber === -1 || typeof elementNumber === "undefined") {
      return;
    }

    const ui = $user_input;
    user_input.set({
      dx: ui.dx,
      dy: ui.dy,
      pagenumber: ui.pagenumber,
      elementnumber: elementNumber,
      eventtype: ui.eventtype,
    });
  }

  let [dx, dy] = [undefined, undefined];
  $: {
    if ($user_input || $elementNameStore) {
      const noDevice = $user_input.elementnumber === -1;
      if (dx !== $user_input.dx || dy !== $user_input.dy || noDevice) {
        dx = noDevice ? undefined : $user_input.dx;
        dy = noDevice ? undefined : $user_input.dy;
        renderElementList();
      }
    }
  }

  function renderElementList() {
    const ui = $user_input;
    const device = $runtime.find(
      (device) => device.dx === ui.dx && device.dy === ui.dy
    );
    if (typeof device === "undefined") {
      options = [{ title: "No Device", value: -1 }];
      selectedElementNumber = -1;
      return;
    }
    const control_elements = device.pages.find(
      (page) => page.pageNumber === ui.pagenumber
    )?.control_elements;
    options = control_elements.map((element) => {
      const stringName = getElementName(element.elementIndex);
      if (typeof stringName !== "undefined") {
        return { title: stringName, value: element.elementIndex };
      } else {
        return {
          title: `Element ${
            element.elementIndex < 255
              ? element.elementIndex
              : control_elements.length - 1
          } (${
            element.controlElementType[0].toUpperCase() +
            element.controlElementType.slice(1).toLowerCase()
          })`,
          value: element.elementIndex,
        };
      }
    });
    selectedElementNumber = ui.elementnumber;
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
        toggleValue={$moduleOverlay === "control-name-overlay"}
      />
    </div>
  </div>
  {#key options}
    <MeltSelect bind:target={selectedElementNumber} {options} />
  {/key}
</div>
