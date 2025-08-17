<script lang="ts">
  import { get } from "svelte/store";
  import { tooltip } from "./../_actions/tooltip.ts";
  import { appSettings } from "../../runtime/app-helper.store";
  import { MeltSelect, MoltenButton, Toggle } from "@intechstudio/grid-uikit";
  import {
    ModuleOverlayType,
    moduleOverlay,
  } from "../../runtime/moduleOverlay";
  interface Props {
    [key: string]: any
  }

  let { ...props }: Props = $props();

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

<container class={props.class}>
  <div
    style="background-color: var(--background); color: var(--foreground-muted)"
    class="flex flex-row items-center p-2 gap-3 px-3 rounded-lg"
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
        value={$moduleOverlay === "control-name-overlay"}
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
      <MoltenButton
        title={"Reset View"}
        click={handleGridLayoutResetClicked}
        disabled={$appSettings.gridLayoutShift.x == 0 &&
          $appSettings.gridLayoutShift.y == 0 &&
          $appSettings.persistent.size == $appSettings.defaultSize}
      />
    </div>
  </div></container
>
