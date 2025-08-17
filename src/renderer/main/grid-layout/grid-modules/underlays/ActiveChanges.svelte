<script lang="ts">
  import { GridElement } from "./../../../../runtime/runtime";
  import { createEventDispatcher } from "svelte";

  interface Props {
    element: GridElement;
    isLeftCut?: boolean;
    isRightCut?: boolean;
    visible?: boolean;
  }

  let {
    element,
    isLeftCut = false,
    isRightCut = false,
    visible = false
  }: Props = $props();

  const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if visible}
  <div
    class="changeable-element
    {$element.hasChanges() ? 'changed-element' : ''}
      {isRightCut ? 'corner-cut-r' : ''}
      {isLeftCut ? 'corner-cut-l' : ''}"
    style="   {$element.elementIndex == 255
      ? 'border-top-left-radius: 20px; border-top-right-radius: 20px;'
      : 'border-radius: var(--grid-rounding);'}   "
    onclick={() => {
      dispatch("click", {
        elementNumber: $element.elementIndex,
      });
    }}
></div>
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
