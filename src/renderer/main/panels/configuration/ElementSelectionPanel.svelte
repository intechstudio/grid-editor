<script>
  import { get } from "svelte/store";
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import Toggle from "../../user-interface/Toggle.svelte";
  import { moduleOverlay } from "../../../runtime/moduleOverlay";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import { user_input, runtime } from "../../../runtime/runtime.store";
  import {
    elementNameStore,
    getElementName,
    getElementDefaultName,
  } from "../../../runtime/element-name.store";

  function showControlElementNameOverlay() {
    const show = get(moduleOverlay) !== "control-name-overlay";
    if (show) {
      moduleOverlay.show("control-name-overlay");
    } else {
      moduleOverlay.close();
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

  $: {
    if ($user_input || $elementNameStore) {
      renderElementList();
    }
  }

  function renderElementList() {
    const { dx, dy, pagenumber, elementnumber } = $user_input;
    const device = runtime.getModule(dx, dy);
    if (typeof device === "undefined") {
      options = [{ title: "No Device", value: -1 }];
      selectedElementNumber = -1;
      return;
    }

    console.log(device, device.getPage(pagenumber));
    const control_elements = device.getPage(pagenumber)?.getControlElements();
    options = control_elements.map((element) => {
      let name = getElementName(dx, dy, pagenumber, element.elementIndex);
      if (typeof name === "undefined") {
        name = getElementDefaultName(dx, dy, pagenumber, element.elementIndex);
      }
      return { title: name, value: element.elementIndex };
    });
    selectedElementNumber = elementnumber;
  }
</script>

<div class="flex flex-col text-white">
  <div class="flex flex-row justify-between items-center py-1">
    <div class="flex flex-row items-center">
      <div class="text-gray-500 text-sm">Element Name</div>
      <TooltipQuestion
        key={"configuration_element_name"}
        class="ml-2 text-white"
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
