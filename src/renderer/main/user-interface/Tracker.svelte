<script>
  import { tooltip } from "./../_actions/tooltip.ts";
  import { appSettings } from "../../runtime/app-helper.store";
  import { MeltSelect, MoltenPushButton } from "@intechstudio/grid-uikit";

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
  <div class="flex flex-row items-center gap-2 bg-primary py-2 px-3 rounded-lg">
    <div class="flex flex-row gap-2 items-center">
      <span class="text-white">Track:</span>
      <div
        use:tooltip={{
          placement: "top",
          class: "w-60 p-4 z-10",
          key: "tracker_tooltip",
        }}
        class="w-24 h-fit text-white"
      >
        <MeltSelect
          bind:target={$appSettings.persistent.changeOnEvent}
          {options}
        />
      </div>
    </div>
    <div
      use:tooltip={{
        placement: "top",
        class: "w-60 p-4 z-10",
        key: "reset_grid_layout",
      }}
    >
      <MoltenPushButton
        text={"Reset View"}
        click={handleGridLayoutResetClicked}
        snap={"full"}
        disabled={$appSettings.gridLayoutShift.x == 0 &&
          $appSettings.gridLayoutShift.y == 0}
      />
    </div>
  </div>
</container>
