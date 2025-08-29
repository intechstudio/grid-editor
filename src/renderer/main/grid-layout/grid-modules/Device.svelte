<script lang="ts">
  import { appClipboard } from "./../../../runtime/clipboard.store";
  import { user_input } from "./../../../runtime/user-input.store";
  import {
    isCopyElementEnabled,
    isOverwriteElementEnabled,
    isDiscardElementEnabled,
    isClearElementEnabled,
  } from "./../../panels/configuration/components/Toolbar";
  import {
    overwriteElement,
    copyElement,
    discardElement,
    clearElement,
  } from "./../../../runtime/operations";
  import { contextMenu, contextTarget } from "@intechstudio/grid-uikit";
  import XX16 from "./devices/XX16.svelte";
  import PBF4 from "./devices/PBF4.svelte";
  import EF44 from "./devices/EF44.svelte";
  import VSNX from "./devices/VSNX.svelte";

  //Overlays
  import ControlNameOverlay from "./overlays/ControlNameOverlay.svelte";
  import ProfileLoadOverlay from "./overlays/ProfileLoadOverlay.svelte";
  import PresetLoadOverlay from "./overlays/PresetLoadOverlay.svelte";

  //Underlays
  import PortState from "./underlays/PortState.svelte";
  import ActiveChanges from "./underlays/ActiveChanges.svelte";
  import ElementSelection from "./underlays/ElementSelection.svelte";

  import { appSettings } from "../../../runtime/app-helper.store";
  import { moduleOverlay } from "../../../runtime/moduleOverlay";
  import { selectedConfigStore } from "../../../runtime/config-helper.store";
  import { onMount, SvelteComponent } from "svelte";
  import ModuleSelection from "./underlays/ModuleBorder.svelte";
  import { get } from "svelte/store";
  import {
    profile_cloud,
    profileCloudConfigDrag,
  } from "../../panels/profileCloud/ProfileCloud.js";
  import {
    GridElement,
    GridModule,
    GridPage,
    GridRuntime,
  } from "../../../runtime/runtime";
  import { ElementType, ModuleType } from "@intechstudio/grid-protocol";
  import { getNeighbour, KeyboardTarget } from "../Device";
  import { Grid } from "../../../lib/_utils";
  import { Focus } from "../../_actions/focus.action";

  export let device: GridModule = undefined;
  export let width = 225;
  export let scale: number = 1.0;
  export let interactive: boolean;

  let runtime = device.parent as GridRuntime;

  function selectNextNeighBour(
    element: GridElement,
    direction: Grid.Direction,
  ) {
    const target = getNeighbour(element, direction);
    if (!target) {
      return;
    }

    const page = target.parent as GridPage;
    const module = page.parent as GridModule;
    Focus.trigger(`${module.id}-${target.elementIndex}`);
  }

  type SharedProps = {
    moduleWidth: any;
    device: GridModule;
    id?: ModuleType;
    [key: string]: any;
  };

  type ModuleComponent = {
    new (options: { target: Element; props: SharedProps }): SvelteComponent;
  };

  let component: ModuleComponent | undefined;

  onMount(() => {
    const components: {
      type: string;
      component: ModuleComponent;
    }[] = [
      { type: "BU16", component: XX16 },
      { type: "PO16", component: XX16 },
      { type: "PBF4", component: PBF4 },
      { type: "EN16", component: XX16 },
      { type: "EF44", component: EF44 },
      { type: "TEK2", component: VSNX },
      { type: "TEK1", component: VSNX },
      { type: "VSN0", component: VSNX },
      { type: "VSN1L", component: VSNX },
      { type: "VSN1R", component: VSNX },
      { type: "VSN2", component: VSNX },
    ];
    component = components.find((e) => e.type === device?.type).component;
  });

  function visualDebugEffect(dom_element, color) {
    dom_element.style.backgroundColor = color;
    // Change the background color to red
    dom_element.style.backgroundColor = color;

    // After 500ms, change it back to the original color
    setTimeout(() => {
      dom_element.style.backgroundColor = "";
    }, 200);
  }

  function selectModule() {
    if (device?.dx == $user_input.dx && device?.dy == $user_input.dy) {
      return;
    }

    selectElement(0);
  }

  function selectElement(element: number) {
    user_input.set({
      dx: device?.dx,
      dy: device?.dy,
      pagenumber: $user_input.pagenumber,
      elementnumber: element,
      eventtype: $user_input.eventtype,
    });
  }

  function handleOverwriteElement(element) {
    overwriteElement(element);
  }

  function handleDiscardElement(element) {
    discardElement(element);
  }

  function handleCopyElement(element) {
    copyElement(element);
  }

  function handleClearElement(element) {
    clearElement(element);
  }

  function handleOverwriteModule(device) {
    console.warn("Overwrite module NOT IMPLEMENTED", device);
  }

  function handleDiscardModule(device) {
    console.warn("Discard module NOT IMPLEMENTED", device);
  }

  function handleCopyModule(device) {
    console.warn("Copy module NOT IMPLEMENTED", device);
  }

  function handleClearModule(device) {
    console.warn("Clear module NOT IMPLEMENTED", device);
  }

  const modifier =
    ctxProcess.platform() == "darwin" ||
    window.navigator.platform.indexOf("Mac") != -1
      ? ["Cmd ⌘", "Alt ⌥"]
      : ["Ctrl", "Alt"];

  function handleDragEnter(target: GridPage | GridElement) {
    const message = {
      messageType: "configDragTargetChange",
      target: target.getInfo(),
    };

    profile_cloud.sendMessage(message);
  }

  function handleDragLeave() {
    const message = {
      messageType: "configDragTargetChange",
      target: undefined,
    };

    profile_cloud.sendMessage(message);
  }

  let isDrag = false;
  let dragged: {
    configType: "profile" | "preset";
    targetType: ModuleType | ElementType;
  } = undefined;

  $: {
    isDrag = typeof $profileCloudConfigDrag !== "undefined";
    if (isDrag) {
      switch ($profileCloudConfigDrag.configType) {
        case "profile": {
          dragged = {
            configType: "profile",
            targetType: $profileCloudConfigDrag.type as ModuleType,
          };
          break;
        }
        case "preset": {
          dragged = {
            configType: "preset",
            targetType: $profileCloudConfigDrag.type as ElementType,
          };
          break;
        }
      }
    } else {
      dragged = undefined;
    }
  }
</script>

<button
  class="module drop-shadow"
  class:activator-button={interactive}
  style="transform-origin: top left; transform: scale({scale})"
  tabindex={interactive ? 0 : -1}
  on:focus={() => {
    selectModule();
  }}
  on:click={() => {
    selectModule();
  }}
  on:keydown={(e) => {
    //Ignore if origin node is input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target instanceof Element && e.target.hasAttribute("contenteditable"))
    ) {
      e.stopPropagation();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      handleCopyModule(device);
      visualDebugEffect(e.target, "gray");
      e.preventDefault();
      e.stopPropagation();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      handleOverwriteModule(device);
      visualDebugEffect(e.target, "gray");
      e.preventDefault();
      e.stopPropagation();
    } else if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      e.key.toLowerCase() === "d"
    ) {
      handleDiscardModule(device);
      visualDebugEffect(e.target, "gray");
      e.preventDefault();
      e.stopPropagation();
    } else if (e.shiftKey && e.key.toLowerCase() === "delete") {
      handleClearModule(device);
      visualDebugEffect(e.target, "gray");
      e.preventDefault();
      e.stopPropagation();
    }
  }}
>
  <svelte:component
    this={component}
    data-testid={`${interactive ? "" : `${device.id}_`}${device.type}_dx:${device.dx};dy:${device.dy}`}
    {device}
    moduleWidth={width}
    let:elementNumber
    let:device
  >
    <!-- Module Underlays -->
    <svelte:fragment slot="module-underlay" let:device>
      <!-- Default Backdrop -->

      <div
        class="absolute w-full h-full"
        style="border-radius: var(--grid-rounding);"
      />
      <PortState
        {device}
        visible={$appSettings.persistent.portstateOverlayEnabled}
      />
      {#if interactive}
        <ModuleSelection
          {device}
          visible={true}
          class="absolute top-0 left-0 w-full h-full"
          style="border-radius: var(--grid-rounding);"
        />
      {/if}
    </svelte:fragment>

    <!-- Cell Underlays -->
    <svelte:fragment
      slot="cell-underlay"
      let:elementNumber
      let:isLeftCut
      let:isRightCut
    >
      {#if interactive}
        {@const element = device
          .findPage($user_input.pagenumber)
          .findElement(elementNumber)}
        <button
          id={element.id}
          on:focus={() => selectElement(elementNumber)}
          on:keydown={(e) => {
            const dirMap = {
              ArrowLeft: Grid.Direction.LEFT,
              ArrowRight: Grid.Direction.RIGHT,
              ArrowUp: Grid.Direction.UP,
              ArrowDown: Grid.Direction.DOWN,
            };

            const direction = dirMap[e.key];
            if (direction) {
              selectNextNeighBour(element, direction);
            }

            if (e.key === "Enter") {
              Focus.trigger("action-list-0");
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
              handleCopyElement(element);
              visualDebugEffect(e.target, "green");
              e.preventDefault();
              e.stopPropagation();
            } else if (
              (e.ctrlKey || e.metaKey) &&
              e.key.toLowerCase() === "v"
            ) {
              handleOverwriteElement(element);
              visualDebugEffect(e.target, "green");
              e.preventDefault();
              e.stopPropagation();
            }

            if (
              (e.ctrlKey || e.metaKey) &&
              e.shiftKey &&
              e.key.toLowerCase() === "d"
            ) {
              handleDiscardElement(element);
              visualDebugEffect(e.target, "green");
              e.preventDefault();
              e.stopPropagation();
            } else if (e.shiftKey && e.key.toLowerCase() === "delete") {
              handleClearElement(element);
              visualDebugEffect(e.target, "green");
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          use:contextTarget={{
            items: [
              {
                text: [`Copy Element`, `(${modifier[0]} + C)`],
                handler: () => handleCopyElement(element),
                isDisabled: () => $isCopyElementEnabled === false,
                iconPath: "copy_all",
              },
              {
                text: [`Overwrite Element`, `(${modifier[0]} + V)`],
                handler: () => handleOverwriteElement(element),
                isDisabled: () =>
                  !isOverwriteElementEnabled(get(element), get(appClipboard)),
                iconPath: "paste_all",
              },
              {
                text: [
                  `Discard Element Changes`,
                  `(${modifier[0]} + Shift + D)`,
                ],
                handler: () => handleDiscardElement(element),
                isDisabled: () => !isDiscardElementEnabled(get(element)),
                iconPath: "clear_from_device_01",
              },
              {
                text: [`Clear Element`, `(Shift + Delete)`],
                handler: () => handleClearElement(element),
                isDisabled: () => !isClearElementEnabled(get(element)),
                iconPath: "clear_element",
              },
            ],
          }}
          use:Focus.on={`${device.id}-${elementNumber}`}
          use:KeyboardTarget.set={device
            .findPage($user_input.pagenumber)
            .findElement(elementNumber)}
          class="w-full h-full absolute element activator-button"
          on:click={(e) => {
            selectElement(elementNumber);
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <ActiveChanges
            {element}
            {isLeftCut}
            {isRightCut}
            visible={typeof $moduleOverlay === "undefined" ||
              $moduleOverlay === "configuration-load-overlay"}
          />
          <ElementSelection
            {element}
            {isLeftCut}
            {isRightCut}
            visible={typeof $moduleOverlay === "undefined" &&
              (typeof $contextMenu === "undefined" ||
                ($user_input.dx === device.dx &&
                  $user_input.dy === device.dy &&
                  $user_input.elementnumber === elementNumber))}
          />
        </button>
      {/if}
    </svelte:fragment>

    <!-- Cell Overlays -->
    <svelte:fragment
      slot="cell-overlay"
      let:elementNumber
      let:isLeftCut
      let:isRightCut
    >
      {#if interactive}
        {@const element = device
          .findPage($user_input.pagenumber)
          .findElement(elementNumber)}
        <div
          class="absolute"
          style="width: calc(100% - var(--element-margin) * 2); 
          height: calc(100% - var(--element-margin) * 2); 
          margin: var(--element-margin);"
        >
          <PresetLoadOverlay
            {element}
            {isLeftCut}
            {isRightCut}
            visible={$moduleOverlay === "configuration-load-overlay" &&
              $selectedConfigStore?.configType === "preset"}
          />
        </div>
        <ControlNameOverlay
          {element}
          visible={$moduleOverlay === "control-name-overlay"}
        />

        {#if isDrag && dragged?.configType === "preset" && dragged?.targetType === element.type}
          <div class="absolute p-2 w-full h-full flex">
            <div
              role="region"
              aria-label="Drop area for presets"
              class="w-full h-full bg-commit/25 pointer-events-auto rounded"
              on:dragenter={() => handleDragEnter(element)}
              on:dragleave|preventDefault={handleDragLeave}
              on:dragover|preventDefault
            />
          </div>
        {/if}
      {/if}
    </svelte:fragment>

    <!-- Module Overlays -->
    <svelte:fragment slot="module-overlay">
      {#if interactive}
        <ProfileLoadOverlay
          {device}
          visible={$moduleOverlay === "configuration-load-overlay" &&
            $selectedConfigStore?.configType === "profile"}
        />
        {#if isDrag && dragged?.configType === "profile" && dragged?.targetType === device.type}
          <div class="absolute p-2 w-full h-full flex">
            <div
              role="region"
              aria-label="Drop area for profiles"
              class="w-full h-full bg-commit/25 pointer-events-auto rounded"
              on:dragenter={() =>
                handleDragEnter(device.findPage($user_input.pagenumber))}
              on:dragleave|preventDefault={handleDragLeave}
              on:dragover|preventDefault
            />
          </div>
        {/if}
      {/if}
    </svelte:fragment>
  </svelte:component>
</button>

<style global>
  .knob-element {
    width: auto;
    height: auto;
    border-radius: 9999px; /* full rounding */
    border-width: 1px;
    border-style: solid;
    border-color: #00000000; /* Tailwind gray-700 */
  }

  .knob-dent {
    fill: var(--background-soft);
    stroke: var(--background-soft);
  }
  .knob-face {
    fill2: var(--background-muted);
  }
  .knob-edge {
    fill: var(--background-muted);
    stroke: var(--background-soft);
  }

  .configpanel.activator-button:focus-within {
    border-color: gray;
  }

  .actionlist.activator-button {
    border: 1px solid rgba(0, 0, 0, 0);
  }

  .actionlist.activator-button:focus-within {
    border-color: gray;
  }

  .dynamicWrapper.activator-button {
    border: 1px solid rgba(0, 0, 0, 0);
    outline: 0px solid rgba(0, 0, 0, 0);
  }

  .dynamicWrapper.activator-button:focus-within {
    border-color: gray;
  }

  .module.activator-button {
    /*border: 1px solid red;*/
  }

  .module.activator-button:focus-within {
    /* outline: 2px dashed gray; Add a blue outline */
  }

  .element.activator-button {
    /*border: 1px solid green;   */
    width: calc(100% - var(--element-margin) * 2);
    height: calc(100% - var(--element-margin) * 2);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    outline: 1px solid rgba(0, 0, 0, 0);
  }

  :root {
    --element-margin: 5px;
    --grid-rounding: 5px;
  }
  .module-dimensions {
    width: var(--module-size);
    height: var(--module-size);
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    border-radius: 6px;
  }

  .bg-overlay {
    background-color: rgba(30, 30, 30, 0.5);
  }

  .normal-cell-underlay-container {
    /*border: 1px solid red;*/
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .normal-cell-ui-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2;
    display: flex;
    padding: 2px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: filter 0.2s;
  }
  .normal-cell-overlay-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 3;
  }
  .system-cell-underlay-container {
    pointer-events: none;
    position: absolute;
    z-index: 1;
  }
  .system-cell-overlay-container {
    pointer-events: none;
    position: absolute;
    z-index: 3;
  }

  .module-underlay-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .module-overlay-container {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 4;
  }
</style>
