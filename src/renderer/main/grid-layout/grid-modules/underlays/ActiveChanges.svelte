<script lang="ts">
  import { GridModule, GridElement } from "./../../../../runtime/runtime";
  import { user_input, runtime } from "../../../../runtime/runtime.store";
  import { createEventDispatcher } from "svelte";

  export let elementNumber: number;
  export let isLeftCut: boolean;
  export let isRightCut: boolean;
  export let device: GridModule;
  export let visible: boolean = false;

  const dispatch = createEventDispatcher();

  const element: GridElement = runtime.findElement(
    device.dx,
    device.dy,
    $user_input.pagenumber,
    elementNumber
  );
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if visible}
  <div
    class="changeable-element
    {element.hasChanges() ? 'changed-element' : ''}
      {isRightCut ? 'corner-cut-r' : ''}
      {isLeftCut ? 'corner-cut-l' : ''}"
    style="   {elementNumber == 255
      ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
      : 'border-radius: var(--grid-rounding);'}   "
    on:click={() => {
      dispatch("click", {
        elementNumber: elementNumber,
      });
    }}
  />
{/if}

<style>
  div.changeable-element {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    position: absolute;
    overflow: hidden;
  }
  div.changed-element::before {
    content: "";
    box-shadow: 0px 300px 0px 1000px rgba(0, 0, 255, 0.4);
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
