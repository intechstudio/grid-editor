<script lang="ts">
  import { get } from "svelte/store";
  import {
    GridElement,
    GridEvent,
    GridModule,
    GridPage,
  } from "../../../../runtime/runtime";
  import {
    user_input,
    UserInputValue,
  } from "../../../../runtime/user-input.store";

  import { createEventDispatcher } from "svelte";
  import { draggedActions } from "../../../_actions/move.action";
  import { Focus } from "../../../_actions/focus.action";

  export let element: GridElement;
  export let isLeftCut = false;
  export let isRightCut = false;
  export let visible = false;

  let page = element.parent as GridPage;
  let module = page.parent as GridModule;
  let elementChangeTimeout: NodeJS.Timeout = undefined;

  const dispatch = createEventDispatcher();

  let isSelected = false;
  $: handleUserInputChange($user_input);
  $: handleSelectionChange(isSelected);

  function handleUserInputChange(ui: UserInputValue) {
    isSelected =
      module.dx == ui?.dx &&
      module.dy == ui?.dy &&
      ui?.elementnumber == element.elementIndex;
  }

  function handleMouseLeave() {
    clearTimeout(elementChangeTimeout);
  }

  function handleMouseEnter(element: GridElement) {
    const ui = get(user_input);

    if (get(draggedActions).length === 0) {
      return;
    }

    if (
      ui.dx === module.dx &&
      ui.dy === module.dy &&
      ui.pagenumber === page.pageNumber &&
      ui.elementnumber === element.elementIndex
    ) {
      return;
    }

    elementChangeTimeout = setTimeout(() => {
      user_input.set({
        dx: module.dx,
        dy: module.dy,
        pagenumber: page.pageNumber,
        elementnumber: element.elementIndex,
        eventtype: ui.eventtype,
      });
    }, 100);
  }

  function handleSelectionChange(value: boolean) {
    if (value) {
      //Wait module to be rendered
      requestAnimationFrame(() => {
        Focus.trigger(`${module.id}-${element.elementIndex}`);
      });
    }
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if visible}
  <div
    class="pointer-events-auto {isSelected
      ? 'selected-element'
      : 'selectable-element'} {$$props.class} 
      element
      {isRightCut ? 'corner-cut-r' : ''}
      {isLeftCut ? 'corner-cut-l' : ''}
      "
    style="   {$element.elementIndex == 255
      ? 'border-top-left-radius: 9999px; border-top-right-radius: 9999px;'
      : 'border-radius: var(--grid-rounding);'}   "
    on:mouseenter={() => handleMouseEnter(element)}
    on:mouseleave={handleMouseLeave}
    on:click={() => {
      dispatch("click", {
        elementNumber: $element.elementIndex,
      });
    }}
  />
{/if}

<style>
  div.element {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  div.selected-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(255, 255, 255, 0.2);
  }
  div.selectable-element:hover:before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(255, 255, 255, 0.1);
  }

  div.corner-cut-l:before {
    position: absolute;
    bottom: -35px;
    left: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
  div.corner-cut-r:before {
    position: absolute;
    bottom: -35px;
    right: -35px;
    width: 60px;
    height: 60px;
    border-radius: 100%;
  }
</style>
