<script>
  import { get } from "svelte/store";
  import { tooltip } from "./../_actions/tooltip.ts";
  import { appSettings } from "../../runtime/app-helper.store";
  import { MeltSelect, MoltenPushButton } from "@intechstudio/grid-uikit";
  import Toggle from "../user-interface/Toggle.svelte";
  import {
    ModuleOverlayType,
    moduleOverlay,
  } from "../../runtime/moduleOverlay";
  import { user_input } from "./../../runtime/user-input.store";

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
      s.persistent.size = s.defaultSize;
      return s;
    });
  }

  function showControlElementNameOverlay() {
    const show = get(moduleOverlay) !== ModuleOverlayType.CONTROL_NAME;
    if (show) {
      moduleOverlay.show(ModuleOverlayType.CONTROL_NAME);
    } else {
      moduleOverlay.close();
    }
  }
</script>

<container class={$$props.class}>
  <div
    class="flex flex-col items-end justify-end gap-2 bg-primary py-2 px-3 rounded-lg"
  >
    <div class="flex flex-row items-center gap-2">
      <span class="text-gray-500 text-sm">Element Name Overlay</span>

      <Toggle
        on:change={showControlElementNameOverlay}
        toggleValue={$moduleOverlay === "control-name-overlay"}
      />
    </div>

    <div class="flex flex-row">
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
            $appSettings.gridLayoutShift.y == 0 &&
            $appSettings.persistent.size == $appSettings.defaultSize}
        />
      </div>
    </div>
  </div>
</container>
