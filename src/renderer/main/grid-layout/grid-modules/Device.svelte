<script>
  import { appClipboard } from "./../../../runtime/clipboard.store.ts";
  import { runtime, user_input } from "./../../../runtime/runtime.store";
  import {
    overwriteElement,
    copyElement,
    discardElement,
    clearElement,
    isCopyElementEnabled,
    isOverwriteElementEnabled,
    isDiscardElementEnabled,
    isClearElementEnabled,
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
  import ModuleInfo from "./underlays/ModuleInfo.svelte";
  import ActiveChanges from "./underlays/ActiveChanges.svelte";
  import ElementSelection from "./underlays/ElementSelection.svelte";

  import { appSettings } from "../../../runtime/app-helper.store";
  import { moduleOverlay } from "../../../runtime/moduleOverlay";
  import { selectedConfigStore } from "../../../runtime/config-helper.store";
  import { onMount } from "svelte";
  import ModuleSelection from "./underlays/ModuleBorder.svelte";
  import { get } from "svelte/store";

  export let device = undefined;
  export let width = 225;
  let component = undefined;

  onMount(() => {
    const components = [
      { type: "BU16", component: XX16 },
      { type: "PO16", component: XX16 },
      { type: "PBF4", component: PBF4 },
      { type: "EN16", component: XX16 },
      { type: "EF44", component: EF44 },
      { type: "TEK2", component: VSNX },
      { type: "TEK1", component: VSNX },
      { type: "VSN0", component: VSNX },
      { type: "VSN1", component: VSNX },
      { type: "VSN1R", component: VSNX },
      { type: "VSN2", component: VSNX },
    ];

    const index = components.findIndex((e) => e.type === device?.type);
    device.type = components[index].type;
    component = components[index].component;
  });

  function handleElementClicked(e) {
    const { elementNumber } = e.detail;
    selectElement(elementNumber);
  }

  function selectElement(element) {
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

  const modifier =
    ctxProcess.platform() == "darwin" ||
    window.navigator.platform.indexOf("Mac") != -1
      ? ["Cmd ⌘", "Alt ⌥"]
      : ["Ctrl", "Alt"];
</script>

<div class="pointer-events-none {$$props.classs}" style={$$props.style}>
  <svelte:component
    this={component}
    {device}
    moduleWidth={width}
    let:elementNumber
    let:device
  >
    <!-- Module Underlays -->
    <svelte:fragment slot="module-underlay" let:device>
      <!-- Default Backdrop -->
      <div
        class="absolute bg-primary w-full h-full"
        style="border-radius: var(--grid-rounding);"
      />
      <PortState
        {device}
        visible={$appSettings.persistent.portstateOverlayEnabled}
      />
      <ModuleSelection
        {device}
        visible={true}
        class="absolute top-0 left-0 w-full h-full"
        style="border-radius: var(--grid-rounding);"
      />
    </svelte:fragment>

    <!-- Cell Underlays -->
    <svelte:fragment
      slot="cell-underlay"
      let:elementNumber
      let:isLeftCut
      let:isRightCut
    >
      {@const element = runtime.findElement(
        device.dx,
        device.dy,
        $user_input.pagenumber,
        elementNumber
      )}
      <button
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
              text: [`Discard Element Changes`, `(${modifier[0]} + Shift + D)`],
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
        class="w-full h-full absolute"
        style="width: calc(100% - var(--element-margin) * 2); 
          height: calc(100% - var(--element-margin) * 2); 
          margin: var(--element-margin); "
        on:mouseup={() => {
          handleElementClicked({ detail: { elementNumber: elementNumber } });
        }}
      >
        <ActiveChanges
          {elementNumber}
          {isLeftCut}
          {isRightCut}
          {device}
          visible={typeof $moduleOverlay === "undefined" ||
            $moduleOverlay === "configuration-load-overlay"}
        />
        <ElementSelection
          {elementNumber}
          {isLeftCut}
          {isRightCut}
          {device}
          visible={typeof $moduleOverlay === "undefined" &&
            (typeof $contextMenu === "undefined" ||
              ($user_input.dx === device.dx &&
                $user_input.dy === device.dy &&
                $user_input.elementnumber === elementNumber))}
        />
      </button>
      <ModuleInfo {device} visible={true} {elementNumber} />
    </svelte:fragment>

    <!-- Cell Overlays -->
    <svelte:fragment
      slot="cell-overlay"
      let:elementNumber
      let:isLeftCut
      let:isRightCut
    >
      <div
        class="absolute"
        style="width: calc(100% - var(--element-margin) * 2); 
          height: calc(100% - var(--element-margin) * 2); 
          margin: var(--element-margin);"
      >
        <PresetLoadOverlay
          {device}
          {elementNumber}
          {isLeftCut}
          {isRightCut}
          visible={$moduleOverlay === "configuration-load-overlay" &&
            $selectedConfigStore?.configType === "preset"}
        />
      </div>
      <ControlNameOverlay
        {device}
        {elementNumber}
        visible={$moduleOverlay === "control-name-overlay"}
      />
    </svelte:fragment>

    <!-- Module Overlays -->
    <svelte:fragment slot="module-overlay">
      <ProfileLoadOverlay
        {device}
        visible={$moduleOverlay === "configuration-load-overlay" &&
          $selectedConfigStore?.configType === "profile"}
      />
    </svelte:fragment>
  </svelte:component>
</div>

<style global>
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
    filter: drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.2));
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
