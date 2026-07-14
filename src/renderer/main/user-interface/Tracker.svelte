<script lang="ts">
  import { get } from "svelte/store";
  import { tooltip } from "./../_actions/tooltip";
  import { appSettings } from "../../runtime/app-helper.store";
  import {
    MeltSelect,
    MoltenPushButton,
    Toggle,
  } from "@intechstudio/grid-uikit";
  import {
    ModuleOverlay,
    type ModuleOverlayType,
    moduleOverlay,
  } from "../../runtime/moduleOverlay";
  import { runtime_manager } from "../../runtime/runtime-manager.store.js";
  import { GridRuntime } from "../../runtime/runtime.js";

  let runtime: GridRuntime;

  $: {
    runtime = $runtime_manager.active.runtime;
  }

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
    runtime.layoutOffset = { x: 0, y: 0 };
    appSettings.update((s) => {
      s.persistent.size = s.defaultSize;
      return s;
    });
  }

  function showControlElementNameOverlay() {
    const show = get(moduleOverlay) !== ModuleOverlay.Types.CONTROL_NAME;
    if (show) {
      moduleOverlay.show(ModuleOverlay.Types.CONTROL_NAME);
    } else {
      moduleOverlay.close();
    }
  }

  function showCalibrationOverlay() {
    const show = get(moduleOverlay) !== ModuleOverlay.Types.CALIBRATION;
    if (show) {
      moduleOverlay.show(ModuleOverlay.Types.CALIBRATION);
    } else {
      moduleOverlay.close();
    }
  }
</script>

<container class={$$props.class}>
  <div
    style="background-color: var(--background); color: var(--foreground); border: 1px solid var(--border); border-radius: var(--radius) ;"
    class="flex flex-row items-center p-3 gap-3"
  >
    <div
      use:tooltip={{
        placement: "top",
        class: "w-60 p-4 z-10",
        key: "configuration_element_name",
      }}
    >
      <Toggle
        title="Name Overlay"
        on:change={showControlElementNameOverlay}
        value={$moduleOverlay === ModuleOverlay.Types.CONTROL_NAME}
      />
    </div>
    <div
      use:tooltip={{
        placement: "top",
        class: "w-60 p-4 z-10",
        key: "configuration_calibration",
      }}
    >
      <Toggle
        title="Calibration"
        on:change={showCalibrationOverlay}
        value={$moduleOverlay === ModuleOverlay.Types.CALIBRATION}
      />
    </div>
    <div
      class="flex gap-2 items-center"
      use:tooltip={{
        placement: "top",
        class: "w-60 p-4 z-10",
        key: "tracker_tooltip",
      }}
    >
      <span>Track:</span>
      <MeltSelect
        bind:target={$appSettings.persistent.changeOnEvent}
        {options}
      />
    </div>
    <div
      class="flex"
      use:tooltip={{
        placement: "top",
        class: "w-60 p-4 z-10",
        key: "reset_grid_layout",
      }}
    >
      <MoltenPushButton
        text={"Reset View"}
        click={handleGridLayoutResetClicked}
        disabled={$runtime.layoutOffset.x == 0 &&
          $runtime.layoutOffset.y == 0 &&
          $appSettings.persistent.size == $appSettings.defaultSize}
      />
    </div>
  </div></container
>
