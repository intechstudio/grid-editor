<script lang="ts">
  import { run } from 'svelte/legacy';

  import {
    GridElement,
    GridModule,
    GridPage,
    GridPresetData,
  } from "./../../../../runtime/runtime";
  import { selectedConfigStore } from "../../../../runtime/config-helper.store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { loadPreset } from "../../../../runtime/operations";
  import { get } from "svelte/store";
  import { Grid } from "../../../../lib/_utils";

  interface Props {
    element: GridElement;
    visible?: boolean;
    isRightCut?: any;
    isLeftCut?: any;
  }

  let {
    element,
    visible = false,
    isRightCut = undefined,
    isLeftCut = undefined
  }: Props = $props();

  let page = element.parent as GridPage;
  let module = page.parent as GridModule;

  let loaded = $state(false);

  enum Compatibility {
    INCOMPATIBLE,
    COMPATIBLE,
    MATCHING,
  }

  let compatible = $state(Compatibility.INCOMPATIBLE);

  function handlePresetLoad(e) {
    const data = get(selectedConfigStore);
    const preset = GridPresetData.createFromCloudData(data);
    loadPreset(preset, element)
      .then(() => {
        loaded = true;
      })
      .catch((e) => {
        loaded = false;
      });
  }

  function handleSelectedConfigChange(data: GridPresetData) {
    loaded = false;

    const leftSideCompatible = element.isCompatible(data.element.type);
    const rightSideCompatible = data.element.isCompatible(element.type);

    if (leftSideCompatible && rightSideCompatible) {
      compatible = Compatibility.MATCHING;
    } else if (leftSideCompatible) {
      compatible = Compatibility.COMPATIBLE;
    } else {
      compatible = Compatibility.INCOMPATIBLE;
    }
  }

  run(() => {
    const store = $selectedConfigStore;
    if (typeof store !== "undefined" && store.configType === "preset") {
      const preset = GridPresetData.createFromCloudData(store);
      handleSelectedConfigChange(preset);
    }
  });
</script>

<container>
  {#if visible}
    {#if compatible === Compatibility.COMPATIBLE || compatible === Compatibility.MATCHING}
      <div
        class="w-full h-full relative overflow-hidden"
        class:loaded-element={loaded && !$element.hasChanges()}
        class:element={!loaded && !$element.hasChanges()}
        class:corner-cut-r={isRightCut}
        class:corner-cut-l={isLeftCut}
        style="{$element.elementIndex == 255
          ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
          : 'border-radius: var(--grid-rounding);'} "
      >
        <div
          class="flex w-full h-full items-center justify-center"
          style="transform: rotate({-$appSettings.persistent.moduleRotation +
            $module?.rot * Grid.Rotation.R90}deg);"
        >
          {#if !loaded}
            <button
              onclick={handlePresetLoad}
              class="rounded pointer-events-auto {compatible ===
              Compatibility.MATCHING
                ? 'matching-icon'
                : 'compatible-icon'} bg-opacity-75 p-1"
              class:icon-corner-cut-r={isRightCut}
              class:icon-corner-cut-l={isLeftCut}
              class:scale-50={$element.elementIndex === 255}
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
        class:disabled-element={!$element.hasChanges()}
        class:corner-cut-r={isRightCut}
        class:corner-cut-l={isLeftCut}
        style="{$element.elementIndex === 255
          ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
          : 'border-radius: var(--grid-rounding);'} "
></div>
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
