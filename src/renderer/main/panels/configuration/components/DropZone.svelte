<script>
  import { createEventDispatcher } from "svelte";
  export let index;
  export let drag_target;

  const dispatch = createEventDispatcher();

  let dropZoneEnabled = true;
  let hovered = false;

  $: if (drag_target.length === 1) {
    const dragIndex = Number(drag_target.at(0));
    handleDrag(dragIndex);
  } else if (drag_target.length > 1) {
    const firstDragIndex = Number(drag_target.at(0));
    const lastDragIndex = Number(drag_target.at(-1));
    handleMultiDrag(firstDragIndex, lastDragIndex);
  }

  function handleDrag(dragIndex) {
    dropZoneEnabled = index != dragIndex && index != dragIndex + 1;
  }

  function handleMultiDrag(firstDragIndex, lastDragIndex) {
    dropZoneEnabled = index < firstDragIndex || index > lastDragIndex;
  }

  function handleMouseOver() {
    hovered = true;
    dispatch("drop-target-change", { index: index });
  }

  function handleMouseOut() {
    hovered = false;
    dispatch("drop-target-change", { index: undefined });
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<drop-zone
  class="block select-none focus:outline-none border-none outline-none"
  on:mouseover={handleMouseOver}
  on:mouseout={handleMouseOut}
>
  <div
    class="{hovered
      ? 'opacity-100 '
      : 'opacity-0 '} h-5 w-full pointer-events-none transition-opacity duration-300 flex items-center"
  >
    <div
      class="h-2 w-full rounded-full {dropZoneEnabled
        ? 'bg-commit'
        : 'bg-red-500'}"
    />
  </div>
</drop-zone>
