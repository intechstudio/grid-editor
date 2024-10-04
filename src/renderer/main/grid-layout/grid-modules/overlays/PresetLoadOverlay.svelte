<script lang="ts">
  import { GridPresetData } from "./../../../../runtime/runtime.ts";
  import { grid } from "@intechstudio/grid-protocol";
  import { user_input, runtime } from "./../../../../runtime/runtime.store";
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { get } from "svelte/store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { Analytics } from "../../../../runtime/analytics.js";

  export let device = undefined;
  export let visible = false;
  export let elementNumber = undefined;
  export let isRightCut = undefined;
  export let isLeftCut = undefined;

  let type = undefined;
  let loaded = false;

  enum Compatibility {
    INCOMPATIBLE,
    COMPATIBLE,
    MATCHING,
  }

  let compatible = Compatibility.INCOMPATIBLE;

  $: {
    if (elementNumber === 255) {
      type =
        device?.pages[0].control_elements[
          device?.pages[0].control_elements.length - 1
        ]?.type;
    } else {
      type = device?.pages[0].control_elements[elementNumber]?.type;
    }
  }

  function handlePresetLoad(e) {
    Analytics.track({
      event: "Preset Load Start",
      payload: {},
      mandatory: false,
    });

    const ui = get(user_input);
    const element = runtime.findElement(
      device.dx,
      device.dy,
      ui.pagenumber,
      elementNumber
    );
    const preset = GridPresetData.createFromCloudData($selectedConfigStore);
    element
      .loadPreset(preset)
      .then(() => {
        loaded = true;
        Analytics.track({
          event: "Preset Load Success",
          payload: {},
          mandatory: false,
        });

        if (ui.dx !== device.dx || ui.dy !== device.dy) {
          user_input.set({
            dx: device.dx,
            dy: device.dy,
            pagenumber: ui.pagenumber,
            elementnumber: elementNumber,
            eventtype: ui.eventtype,
          });
        }
      })
      .catch((e) => {
        loaded = false;
      });
  }

  let isChanged = false;

  $: handleDeviceChange(device);

  function handleDeviceChange(obj) {
    const { dx, dy } = obj;
    const ui = get(user_input);

    const target = runtime.findElement(dx, dy, ui.pagenumber, elementNumber);

    if (typeof target === "undefined") {
      isChanged = false;
      return;
    }

    //Find the event that has change
    const changed = target.hasChanges();
    isChanged = typeof changed !== "undefined";
  }

  function handleSelectedConfigChange(store) {
    loaded = false;

    if (typeof store === "undefined" || store?.configType === "profile") {
      return;
    }

    const leftSideCompatible = grid.is_element_compatible_with(
      type,
      store.type
    );
    const rightSideCompatible = grid.is_element_compatible_with(
      store.type,
      type
    );

    if (leftSideCompatible && rightSideCompatible) {
      compatible = Compatibility.MATCHING;
    } else if (rightSideCompatible) {
      compatible = Compatibility.COMPATIBLE;
    } else {
      compatible = Compatibility.INCOMPATIBLE;
    }
  }

  $: handleSelectedConfigChange($selectedConfigStore);
</script>

<container>
  {#if visible}
    {#if compatible === Compatibility.COMPATIBLE || compatible === Compatibility.MATCHING}
      <div
        class="w-full h-full relative overflow-hidden"
        class:loaded-element={loaded && !isChanged}
        class:element={!loaded && !isChanged}
        class:corner-cut-r={isRightCut}
        class:corner-cut-l={isLeftCut}
        style="{elementNumber == 255
          ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
          : 'border-radius: var(--grid-rounding);'} "
      >
        <div
          class="flex w-full h-full items-center justify-center"
          style="transform: rotate({-$appSettings.persistent.moduleRotation +
            device?.rot * 90}deg);"
        >
          {#if !loaded}
            <button
              on:click={handlePresetLoad}
              class="rounded pointer-events-auto {compatible ===
              Compatibility.MATCHING
                ? 'matching-icon'
                : 'compatible-icon'} bg-opacity-75 p-1"
              class:icon-corner-cut-r={isRightCut}
              class:icon-corner-cut-l={isLeftCut}
              class:scale-50={elementNumber == 255}
            >
              <SvgIcon
                fill={compatible === Compatibility.MATCHING ? "#FFF" : "#000"}
                iconPath={loaded ? "tick" : "download"}
              />
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div
        class="w-full h-full"
        class:disabled-element={!isChanged}
        class:corner-cut-r={isRightCut}
        class:corner-cut-l={isLeftCut}
        style="{elementNumber == 255
          ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
          : 'border-radius: var(--grid-rounding);'} "
      />
    {/if}
  {/if}
</container>

<style>
  :root {
    --preset-load-color: rgba(11, 164, 132, 0.8);
    --preset-load-hover-color: rgba(11, 164, 132, 1);
    --preset-warning-color: rgb(220, 179, 8, 0.8);
    --preset-warning-hover-color: rgb(220, 179, 8, 1);
    --preset-load-success-color: rgba(50, 50, 50, 1);
    --preset-disabled-color: rgba(0, 0, 0, 0.1);
  }

  .matching-icon {
    overflow: hidden;
    background-color: var(--preset-load-color);
  }
  .matching-icon:hover {
    overflow: hidden;
    background-color: var(--preset-load-hover-color);
  }

  .compatible-icon {
    overflow: hidden;
    background-color: var(--preset-warning-color);
  }
  .compatible-icon:hover {
    overflow: hidden;
    background-color: var(--preset-warning-hover-color);
  }

  .element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--preset-disabled-color);
  }

  .disabled-element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .disabled-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px var(--preset-disabled-color);
  }

  .icon-corner-cut-l:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    left: -35px;
    width: 46px;
    height: 46px;
    border-radius: 100%;
  }
  .icon-corner-cut-r:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    right: -35px;
    width: 46px;
    height: 46px;
    border-radius: 100%;
  }

  .corner-cut-l:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    left: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
  .corner-cut-r:before {
    position: absolute;
    z-index: -1;
    bottom: -35px;
    right: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
</style>
