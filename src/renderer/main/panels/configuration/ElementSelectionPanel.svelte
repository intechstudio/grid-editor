<script lang="ts">
  import { run } from 'svelte/legacy';

  import { get } from "svelte/store";
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import {
    ModuleOverlayType,
    moduleOverlay,
  } from "../../../runtime/moduleOverlay";
  import TooltipQuestion from "../../user-interface/tooltip/TooltipQuestion.svelte";
  import { user_input } from "./../../../runtime/user-input.store";
  import { appSettings } from "./../../../runtime/app-helper.store";
  import { GridPage, PageData } from "../../../runtime/runtime";

  interface Props {
    page: GridPage;
  }

  let { page }: Props = $props();

  let selectedElementNumber = $state(-1);
  let options = $state([{ title: "No Device", value: -1 }]);


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


  function handlePageChange(page: PageData) {
    if (typeof page === "undefined") {
      options = [{ title: "No Device", value: -1 }];
      selectedElementNumber = -1;
      return;
    }

    const elements = page.control_elements.filter(
      (e) =>
        e.getHumanName().indexOf("System") === -1 ||
        $appSettings.persistent.userLevelMinimalist === false,
    );

    if (
      $appSettings.persistent.userLevelMinimalist === true &&
      $user_input.elementnumber === 255
    ) {
      user_input.update((s) => {
        s.elementnumber = 0;
        return s;
      });
    }

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
          title: e.getHumanName(),
          value: e.elementIndex,
        };
      }
    });
    selectedElementNumber = get(user_input).elementnumber;
  }
  run(() => {
    handleSelectedChange(selectedElementNumber);
  });
  run(() => {
    handlePageChange($page, $appSettings);
  });
</script>

{#key $page}
  <MeltSelect bind:target={selectedElementNumber} {options} disabled={false} />
{/key}
