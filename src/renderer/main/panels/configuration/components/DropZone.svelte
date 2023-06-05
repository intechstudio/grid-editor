<script>
  export let index;
  export let drag_start;
  export let drop_target;
  export let drag_target;
  export let animation;

  let dropZoneEnabled = true;

  $: if (drag_target.length === 1) {
    const dragIndex = Number(drag_target.at(0));
    handleDrag(dragIndex);
  } else if (drag_target.length > 1) {
    const firstDragIndex = Number(drag_target.at(0));
    const lastDragIndex = Number(drag_target.at(-1));
    handleMultiDrag(firstDragIndex, lastDragIndex);
  }

  function handleDrag(dragIndex) {
    console.log(index, dragIndex);
    dropZoneEnabled = index != dragIndex - 1 && index != dragIndex;
  }

  function handleMultiDrag(firstDragIndex, lastDragIndex) {
    dropZoneEnabled = index < firstDragIndex - 1 && index > lastDragIndex;
  }
</script>

<!-- enabled drop zone ui, id="dz-" -->
<drop-zone
  id="dz-{index}"
  class="block select-none focus:outline-none border-none outline-none"
>
  <div
    class="{drop_target == index && drag_start && !animation
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
