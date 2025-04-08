<script lang="ts">
  import { get } from "svelte/store";
  import { appSettings } from "../../../../runtime/app-helper.store";
  import { onMount } from "svelte";

  let isActive = false;
  let isDrag = false;

  interface Point {
    x: number;
    y: number;
  }

  let currentShift: Point;
  let start: Point;

  onMount(() => {
    currentShift = get(appSettings).gridLayoutShift;
  });

  function handleKeyEvent(e: KeyboardEvent) {
    const { type, key } = e;
    if (key !== "Control") {
      return;
    }

    switch (type) {
      case "keydown": {
        isActive = true;
        break;
      }

      case "keyup": {
        isActive = false;
        break;
      }
    }
  }

  function handleMouseEvent(event: MouseEvent) {
    const { type, button, screenX, screenY } = event;
    if (button !== 0) return;

    if (!isActive) {
      return;
    }

    switch (type) {
      case "mousedown": {
        currentShift = get(appSettings).gridLayoutShift;
        start = { x: screenX, y: screenY };
        isDrag = true;
        break;
      }

      case "mouseup": {
        isDrag = false;
      }
    }
  }

  function handleMouseMove(event: MouseEvent) {
    const { screenX, screenY } = event;
    if (!isDrag || !isActive) return;

    const end = { x: screenX, y: screenY };

    appSettings.update((s) => {
      const [shiftX, shiftY] = [end.x - start.x, end.y - start.y];
      s.gridLayoutShift = {
        x: currentShift.x + shiftX,
        y: currentShift.y + shiftY,
      };
      return s;
    });
  }

  function handleMouseLeave(e: MouseEvent) {
    isActive = false;
    isDrag = false;
  }

  function handleMouseWheel(e: WheelEvent) {
    const as = get(appSettings);
    const deltaY = Math.sign(e.deltaY);

    if (
      (deltaY > 0 && as.persistent.size >= as.maxSize) ||
      (deltaY < 0 && as.persistent.size <= as.minSize)
    ) {
      return;
    }

    appSettings.update((s) => ({
      ...s,
      persistent: {
        ...s.persistent,
        size: s.persistent.size + s.stepSize * deltaY,
      },
    }));
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
  on:mousewheel|preventDefault={handleMouseWheel}
  class:pointer-events-none={!isActive}
  class:cursor-grabbing={isDrag}
  class:cursor-grab={isActive}
/>
