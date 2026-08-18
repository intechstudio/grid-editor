<script lang="ts">
  import { ElementType } from "@intechstudio/grid-protocol";
  import { get } from "svelte/store";
  import {
    GridElement,
    GridEvent,
    GridModule,
    GridPage,
    GridRuntime,
  } from "../../../../runtime/runtime";
  import {
    user_input,
    type UserInputValue,
  } from "../../../../runtime/user-input.store";

  import { createEventDispatcher, onMount } from "svelte";
  import { draggedActions } from "../../../_actions/move.action";
  import { Focus } from "../../../_actions/focus.action";

  export let element: GridElement;
  export let isLeftCut = false;
  export let isRightCut = false;
  export let visible = false;

  let page = element.parent as GridPage;
  let module = page.parent as GridModule;
  let runtime = module.parent as GridRuntime;

  let elementChangeTimeout: NodeJS.Timeout = undefined;

  const dispatch = createEventDispatcher();

  let isSelected = false;
  let mounted = false;
  $: handleUserInputChange($user_input);
  $: if (mounted) {
    handleSelectionChange(isSelected);
  }

  onMount(() => {
    mounted = true;
  });

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
      Focus.trigger(`${module.id}-${element.elementIndex}`);
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
      {element.type === ElementType.LCD ? 'lcd-element' : ''}
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
  ></div>
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
    box-shadow: 0px 300px 0px 1000px
      color-mix(in srgb, var(--foreground) 20%, var(--background));
  }
  div.selectable-element:hover:before {
    content: "";
    box-shadow: 0px 300px 0px 1000px
      color-mix(in srgb, var(--foreground) 10%, var(--background));
  }

  /* LCD content sits beneath this interaction layer, so use an outline instead
     of the full-surface selection shadow. */
  div.lcd-element.selected-element::before {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 4px
      color-mix(in srgb, var(--foreground) 20%, var(--background));
  }

  div.lcd-element.selectable-element:hover:before {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--foreground) 10%, var(--background));
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
