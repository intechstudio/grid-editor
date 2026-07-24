<script lang="ts">
  import { SvgIcon } from "@intechstudio/grid-uikit";
  import { EventType, EventTypeToNumber } from "@intechstudio/grid-protocol";
  import {
    ActionData,
    GridAction,
    GridElement,
    GridPage,
  } from "../../../runtime/runtime";
  import { appSettings } from "../../../runtime/app-helper.store";
  import { updateAction } from "../../../runtime/operations";
  import {
    generateScript,
    information as elementNameInformation,
  } from "../../../config-blocks/ElementName.svelte";
  import ElementSelectionPanel from "./ElementSelectionPanel.svelte";

  export let page: GridPage;
  export let element: GridElement | undefined;

  let elementName = "";
  let displayedName = "";
  let isEditingName = false;
  let previousElement: GridElement | undefined;

  $: if (elementName !== displayedName) {
    displayedName = elementName;
    updateElementName(elementName);
  }

  $: if (element !== previousElement) {
    previousElement = element;
    loadElementName(element);
  }

  $: ($element, refreshElementName(element));

  function loadElementName(target: GridElement | undefined) {
    if (!target) {
      setDisplayedName("");
      return;
    }

    if (target.isLoaded()) {
      refreshElementName(target);
      return;
    }

    target
      .load()
      .then(() => {
        if (element === target) {
          refreshElementName(target);
        }
      })
      .catch((error) => console.error("Failed to load element:", error));
  }

  function refreshElementName(target: GridElement | undefined) {
    if (!target?.isLoaded()) {
      return;
    }

    const nameAction = target
      .findEvent(EventTypeToNumber(EventType.SETUP))
      ?.config.find((action) => action.short === elementNameInformation.short);
    const name = nameAction ? getActionName(nameAction) : "";

    target.name = name || undefined;
    setDisplayedName(name);
  }

  function setDisplayedName(name: string) {
    elementName = name;
    displayedName = name;
  }

  function updateElementName(name: string) {
    if (!element) {
      return;
    }

    const setup = element.findEvent(EventTypeToNumber(EventType.SETUP));
    if (!setup) {
      return;
    }

    const nameAction = setup.config.find(
      (action) => action.short === elementNameInformation.short,
    );

    if (!nameAction) {
      if (name) {
        element.name = name;
        setup
          .insert(
            0,
            new GridAction(
              setup,
              new ActionData(
                elementNameInformation.short,
                generateScript(name),
              ),
            ),
          )
          .catch(console.error);
      } else {
        element.name = undefined;
      }
      return;
    }

    if (!name) {
      element.name = undefined;
      setup.remove(nameAction).catch(console.error);
      return;
    }

    element.name = name;
    const savedName = getActionName(nameAction);
    if (savedName !== name) {
      updateAction(
        nameAction,
        new ActionData(elementNameInformation.short, generateScript(name)),
        false,
      );
    }
  }

  function getActionName(action: GridAction) {
    const pattern = elementNameInformation.valueRegex;
    return pattern ? (action.script.match(pattern)?.[1] ?? "") : "";
  }

  function commitElementName() {
    element?.findEvent(EventTypeToNumber(EventType.SETUP))?.sendToGrid();
  }
</script>

<div class="flex flex-row gap-2 items-center px-3 pb-6">
  <div class="flex flex-grow h-fit min-w-0">
    <ElementSelectionPanel
      {page}
      bind:isEditingName
      bind:elementName
      on:change={commitElementName}
      on:blur={() => {
        isEditingName = false;
        commitElementName();
      }}
      on:keydown={(e) => {
        if (e.detail?.key === "Enter" || e.detail?.key === "Escape") {
          isEditingName = false;
          commitElementName();
        }
      }}
    />
  </div>
  <div class="flex flex-row items-center justify-end gap-2">
    <button
      title="Rename element"
      on:click={() => (isEditingName = !isEditingName)}
      class="cursor-pointer hover:bg-black/25 flex w-fit h-fit p-1.5 rounded"
    >
      <SvgIcon iconPath="edit" fill="#FFF" width={13} height={13} />
    </button>
    <slot name="controls" />
  </div>
</div>
