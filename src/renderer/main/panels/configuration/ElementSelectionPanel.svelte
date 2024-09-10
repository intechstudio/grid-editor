<script lang="ts">
  import { get } from "svelte/store";
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import Toggle from "../../user-interface/Toggle.svelte";
  import {
    ModuleOverlayType,
    moduleOverlay,
  } from "../../../runtime/moduleOverlay";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import { user_input, runtime } from "../../../runtime/runtime.store";
  import { GridPage, PageData } from "../../../runtime/runtime";

  function showControlElementNameOverlay() {
    const show = get(moduleOverlay) !== ModuleOverlayType.CONTROL_NAME;
    if (show) {
      moduleOverlay.show(ModuleOverlayType.CONTROL_NAME);
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

  $: handleUserInputChange($user_input);

  let page: GridPage;

  $: handlePageChange($page);

  function handlePageChange(page: PageData) {
    if (typeof page === "undefined") {
      options = [{ title: "No Device", value: -1 }];
      selectedElementNumber = -1;
      return;
    }

    const elements = page.control_elements;
    options = elements.map((e) => {
      const stringName = e.name;
      if (typeof stringName !== "undefined") {
        return {
          title:
            stringName +
            ` (${e.type[0].toUpperCase() + e.type.slice(1).toLowerCase()})`,
          value: e.elementIndex,
        };
      } else {
        return {
          title: `Element ${
            e.elementIndex < 255 ? e.elementIndex : elements.length - 1
          } (${e.type[0].toUpperCase() + e.type.slice(1).toLowerCase()})`,
          value: e.elementIndex,
        };
      }
    });
    selectedElementNumber = get(user_input).elementnumber;
  }

  function handleUserInputChange(ui: any) {
    const device = runtime.modules.find(
      (device) => device.dx === ui.dx && device.dy === ui.dy
    );

    page = device?.pages.find((page) => page.pageNumber === ui.pagenumber);
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
