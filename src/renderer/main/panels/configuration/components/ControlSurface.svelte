<script lang="ts">
  import { get } from "svelte/store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { onDestroy, onMount } from "svelte";

  let trackMouse = false;
  let dragMouse = false;

  interface Point {
    x: number;
    y: number;
  }

  let startPoint: Point = { x: 0, y: 0 };
  let previousVector = undefined;

  function handleKeyEvent(e) {
    if (e.key !== "Control") {
      return;
    } else {
      //Filter out continous press
      if (e.type === "keydown" && trackMouse) {
        return;
      }
    }

    switch (e.type) {
      case "keydown": {
        handleKeyDown(e);
        break;
      }
      case "keyup": {
        handleKeyUp(e);
        break;
      }
    }
  }

  function handleKeyDown(e) {
    trackMouse = true;
  }

  function handleKeyUp(e) {
    trackMouse = false;
  }

  function handleMouseEvent(e) {
    if (e.button !== 0) {
      return;
    }

    switch (e.type) {
      case "mousedown": {
        handleMouseDown(e);
        break;
      }
      case "mouseup": {
        handleMouseUp(e);
        break;
      }
    }
  }

  function handleMouseDown(e) {
    if (!trackMouse) {
      return;
    }
    startPoint = { x: e.screenX, y: e.screenY };
    dragMouse = true;
    const current = get(appSettings).gridLayoutShift;
    if (current.x === 0 && current.y === 0) {
      previousVector = current;
    }
  }

  function handleMouseUp(e) {
    dragMouse = false;
    previousVector = get(appSettings).gridLayoutShift;
  }

  function handleMouseMove(e) {
    if (!dragMouse) {
      return;
    }

    const endPoint = { x: e.screenX, y: e.screenY };
    calculateShiftVector(startPoint, endPoint);
  }

  function calculateShiftVector(p1: Point, p2: Point) {
    let vector: Point = { x: p2.x - p1.x, y: p2.y - p1.y };
    if (typeof previousVector !== "undefined") {
      vector = {
        x: previousVector.x + vector.x,
        y: previousVector.y + vector.y,
      };
    }

    appSettings.update((s) => {
      s.gridLayoutShift = vector;
      return s;
    });
  }

  function handleMouseLeave(e) {
    handleKeyUp(e);
    handleMouseUp(e);
  }
</script>

<svelte:window on:keydown={handleKeyEvent} on:keyup={handleKeyEvent} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<container
  id="surface"
  class="absolute w-full h-full z-[1]"
  on:mouseleave={handleMouseLeave}
  on:mousemove={handleMouseMove}
  on:mousedown={handleMouseEvent}
  on:mouseup={handleMouseEvent}
  class:pointer-events-none={!trackMouse}
  class:cursor-grabbing={dragMouse}
  class:cursor-grab={trackMouse}
/>
