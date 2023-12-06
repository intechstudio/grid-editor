<script>
  import { runtime, user_input } from "../../../../runtime/runtime.store.js";
  import { createEventDispatcher } from "svelte";

  export let elementNumber;
  export let isLeftCut;
  export let isRightCut;
  export let device;
  export let margin = 4;
  export let visible = false;

  const dispatch = createEventDispatcher();

  let [dx, dy] = [device?.dx, device?.dy];

  let isChanged = false;
  $: {
    try {
      const events = $runtime
        .find((e) => e.dx == dx && e.dy == dy)
        .pages[$user_input.event.pagenumber].control_elements.find(
          (e) => e.controlElementNumber == elementNumber
        ).events;

      //Find the event that has change
      const changed = events.find(
        (e) => typeof e.stored !== "undefined" && e.stored !== e.config
      );

      if (typeof changed !== "undefined") {
        isChanged = true;
      } else {
        isChanged = false;
      }
    } catch (e) {}
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if visible}
  <div
    class="changeable-element
    {isChanged ? 'changed-element' : ''}
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
