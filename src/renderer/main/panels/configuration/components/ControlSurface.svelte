<script lang="ts">
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { onDestroy, onMount } from "svelte";

  let trackMouse = false;
  let dragMouse = false;

  interface Point {
    x: number;
    y: number;
  }

  let startPoint: Point = { x: 0, y: 0 };

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
        trackMouse = true;
        startPoint = undefined;
        break;
      }
      case "keyup": {
        trackMouse = false;
        break;
      }
    }
  }

  function handleMouseEvent(e) {
    if (e.button !== 0 || !trackMouse) {
      return;
    }

    switch (e.type) {
      case "mousedown": {
        startPoint = { x: e.screenX, y: e.screenY };
        dragMouse = true;
        break;
      }
      case "mouseup": {
        dragMouse = false;
        break;
      }
    }
  }

  function handleMouseMove(e) {
    if (!dragMouse) {
      return;
    }

    const endPoint = { x: e.screenX, y: e.screenY };
    calculateShiftVector(startPoint, endPoint);
  }

  function calculateShiftVector(p1: Point, p2: Point) {
    const vector: Point = { x: p2.x - p1.x, y: p2.y - p1.y };
    appSettings.update((s) => {
      s.gridLayoutShift = vector;
      return s;
    });
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeyEvent);
    document.addEventListener("keyup", handleKeyEvent);
    document.addEventListener("mousedown", handleMouseEvent);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseEvent);
  });

  onDestroy(() => {
    document.removeEventListener("keydown", handleKeyEvent);
    document.removeEventListener("keyup", handleKeyEvent);
    document.removeEventListener("mousedown", handleMouseEvent);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseEvent);
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<container
  class="absolute w-full h-full z-[1]"
  class:pointer-events-none={!trackMouse}
  class:cursor-grab={trackMouse}
/>
