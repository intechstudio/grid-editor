<script>
  import TooltipQuestion from "./tooltip/TooltipQuestion.svelte";
  import { appSettings } from "../../runtime/app-helper.store";
  import { Analytics } from "../../runtime/analytics.js";
  import { MeltSelect } from "@intechstudio/grid-uikit";
  import MoltenPushButton, {
    ButtonSnap,
  } from "../panels/preferences/MoltenPushButton.svelte";

  const options = [
    {
      value: "none",
      title: "OFF",
      tooltip_key: "tracker_none",
    },
    {
      value: "element",
      title: "Element",
      tooltip_key: "tracker_element",
    },
    {
      value: "event",
      title: "Event",
      tooltip_key: "tracker_event",
    },
  ];

  function handleGridLayoutResetClicked(e) {
    appSettings.update((s) => {
      s.gridLayoutShift = { x: 0, y: 0 };
      return s;
    });
  }
</script>

<container class={$$props.class}>
  <div class="flex flex-col items-center gap-2 bg-primary py-2 px-3 rounded-lg">
    <div class="flex flex-row items-center">
      <span class="text-white mr-4">Interaction Tracking:</span>
      <div class="w-24 h-fit text-white">
        <MeltSelect
          bind:target={$appSettings.persistent.changeOnEvent}
          {options}
        />
      </div>
    </div>
    <div class="flex flex-row w-full items-center">
      <TooltipQuestion key={"reset_grid_layout"} class="mr-2 text-white " />
      <MoltenPushButton
        text={"Reset Grid Layout"}
        on:click={handleGridLayoutResetClicked}
        snap={ButtonSnap.FULL}
        disabled={$appSettings.gridLayoutShift.x == 0 &&
          $appSettings.gridLayoutShift.y == 0}
      />
    </div>
  </div>
</container>
