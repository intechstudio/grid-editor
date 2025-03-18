<script lang="ts">
  import { GridEvent } from "./../../../../runtime/runtime";
  import {
    dropEventTarget,
    dropzone,
    draggedActions,
    type DropTarget,
  } from "../../../_actions/move.action";

  export let target: { index: number; event: GridEvent } = undefined;

  export let threshold = 25;

  let disabled = false;

  $: handleDropEventTargetChange($dropEventTarget);

  function handleDropEventTargetChange(drop: DropTarget) {
    if (drop?.index !== target.index) {
      return;
    }

    // Always droppable
    const crossDrop = $draggedActions.every(
      (e) => (e.parent as GridEvent) !== target.event
    );
    if (crossDrop) {
      disabled = false;
      return;
    }

    const targetIndexes = $draggedActions.map((action) =>
      target.event.config.findIndex((e) => e.id === action.id)
    );

    const [targetMinIndex, targetMaxIndex] = [
      Math.min(...targetIndexes),
      Math.max(...targetIndexes),
    ];

    disabled =
      target.index >= targetMinIndex && target.index <= targetMaxIndex + 1;
  }
</script>

<div class="flex relative h-2 w-full">
  <div
    class="opacity-0 hover:opacity-75 w-full transition-opacity duration-300 flex items-center absolute top-1/2 -translate-y-1/2"
    style="height: calc(100% + {threshold}px)"
    use:dropzone={(this,
    { event: target.event, disabled: disabled, index: target.index })}
  >
    <div
      class="h-2 w-full rounded-full {disabled ? 'bg-error' : 'bg-commit'}"
    />
  </div>
</div>
