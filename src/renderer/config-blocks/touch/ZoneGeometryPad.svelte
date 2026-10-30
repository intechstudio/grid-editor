<script lang="ts">
  // The touch surface as 9 x 9 cells. The zone is a box on it: drag the box to
  // move it, drag a corner to resize it. Empty cells do nothing. It reports whole cells; the X, Y, Width and Height fields next to it
  // show and set the same numbers.
  import { createEventDispatcher, tick } from "svelte";

  export let x: number;
  export let y: number;
  export let w: number;
  export let h: number;
  // The numbers are out of range or not whole cells: the box is drawn red.
  export let invalid = false;
  // The zone's colour as a CSS colour; without one the box is blue.
  export let color: string | undefined = undefined;
  // The other zones of the surface, drawn dimmer. They take no input, except
  // a zone with an `index` (one of this block's zones): a click on it reports
  // "select".
  export let others: {
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color?: string;
    index?: number;
  }[] = [];

  const SIZE = 9;
  const CELLS = Array.from({ length: SIZE * SIZE }, (_, i) => i);

  const dispatch = createEventDispatcher();

  type Box = { x: number; y: number; w: number; h: number };
  type Drag =
    | { kind: "move"; from: Box; col: number; row: number }
    | { kind: "span"; col: number; row: number };

  let pad: HTMLElement;
  // The zone's box. It takes the DOM focus when pressed, and the resize
  // corners show only while it has it: the focus is what tells that the zone
  // is the one an action (a shortcut, later) would apply to.
  let boxElement: HTMLElement;
  let drag: Drag | null = null;

  const clamp = (n: number, min: number, max: number) =>
    Math.min(Math.max(n, min), max);

  // What the box shows: the numbers kept on the surface, one cell at least.
  function shown(x: number, y: number, w: number, h: number): Box {
    const bx = clamp(Math.round(x), 0, SIZE - 1);
    const by = clamp(Math.round(y), 0, SIZE - 1);
    return {
      x: bx,
      y: by,
      w: clamp(Math.round(w), 1, SIZE - bx),
      h: clamp(Math.round(h), 1, SIZE - by),
    };
  }
  $: box = shown(x, y, w, h);
  $: otherBoxes = others.map((e) => ({
    ...e,
    box: shown(e.x, e.y, e.w, e.h),
  }));

  function cellAt(e: PointerEvent) {
    const r = pad.getBoundingClientRect();
    return {
      col: clamp(
        Math.floor(((e.clientX - r.left) / r.width) * SIZE),
        0,
        SIZE - 1,
      ),
      row: clamp(
        Math.floor(((e.clientY - r.top) / r.height) * SIZE),
        0,
        SIZE - 1,
      ),
    };
  }

  function begin(e: PointerEvent, next: Drag) {
    e.preventDefault();
    e.stopPropagation();
    boxElement?.focus();
    drag = next;
    pad.setPointerCapture(e.pointerId);
  }

  function handleMoveStart(e: PointerEvent) {
    const { col, row } = cellAt(e);
    begin(e, { kind: "move", from: { ...box }, col, row });
  }

  // A corner: the opposite corner stays where it is.
  function handleCornerStart(e: PointerEvent, right: boolean, bottom: boolean) {
    begin(e, {
      kind: "span",
      col: right ? box.x : box.x + box.w - 1,
      row: bottom ? box.y : box.y + box.h - 1,
    });
  }

  function handleMove(e: PointerEvent) {
    if (drag === null) {
      return;
    }
    const { col, row } = cellAt(e);
    if (drag.kind === "move") {
      report({
        ...drag.from,
        x: clamp(drag.from.x + col - drag.col, 0, SIZE - drag.from.w),
        y: clamp(drag.from.y + row - drag.row, 0, SIZE - drag.from.h),
      });
    } else {
      report({
        x: Math.min(drag.col, col),
        y: Math.min(drag.row, row),
        w: Math.abs(col - drag.col) + 1,
        h: Math.abs(row - drag.row) + 1,
      });
    }
  }

  // Shortcuts are scoped to the focused box, like the element button and the
  // action list scope theirs: copy, paste and delete act on the zone that
  // holds the focus, and the event goes no further (the action list would
  // paste action blocks on Ctrl+V).
  function handleKeyDown(e: KeyboardEvent) {
    //Ignore if origin node is input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target instanceof Element && e.target.hasAttribute("contenteditable"))
    ) {
      return;
    }
    const modifier = e.ctrlKey || e.metaKey;
    if (modifier && e.key.toLowerCase() === "c") {
      dispatch("copy");
      visualDebugEffect(e.currentTarget, "green");
    } else if (modifier && e.key.toLowerCase() === "v") {
      dispatch("paste");
      visualDebugEffect(e.currentTarget, "green");
    } else if (e.key === "Delete" || e.key === "Backspace") {
      dispatch("delete");
    } else {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  function visualDebugEffect(node: EventTarget | null, color: string) {
    if (node instanceof HTMLElement) {
      node.style.backgroundColor = color;
      setTimeout(() => {
        node.style.backgroundColor = "";
      }, 200);
    }
  }

  function handleSelect(e: PointerEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    dispatch("select", { index });
    // the box now shows the selected zone: it holds the focus
    tick().then(() => boxElement?.focus());
  }

  function handleUp() {
    if (drag !== null) {
      drag = null;
      dispatch("end");
    }
  }

  // Only a change of a cell is reported, not every pixel of the drag.
  function report(next: Box) {
    if (
      next.x !== x ||
      next.y !== y ||
      next.w !== w ||
      next.h !== h ||
      invalid
    ) {
      dispatch("change", next);
    }
  }
</script>

<div
  bind:this={pad}
  class="pad"
  role="group"
  aria-label="Touch surface, 9 by 9 cells"
  data-geometry-pad
  on:pointermove={handleMove}
  on:pointerup={handleUp}
  on:pointercancel={handleUp}
>
  {#each CELLS as i (i)}
    <div
      class="cell"
      style="grid-column: {(i % SIZE) + 1}; grid-row: {Math.floor(i / SIZE) +
        1};"
    ></div>
  {/each}
  {#each otherBoxes as other}
    <div
      class="other"
      class:selectable={typeof other.index === "number"}
      role="presentation"
      on:pointerdown={(e) =>
        typeof other.index === "number" && handleSelect(e, other.index)}
      data-geometry-other
      title={other.name}
      style="grid-column: {other.box.x + 1} / span {other.box
        .w}; grid-row: {other.box.y + 1} / span {other.box
        .h}; --zone: {other.color ?? '#6b7aff'};"
    ></div>
  {/each}
  <div
    bind:this={boxElement}
    role="button"
    aria-label="Selected zone"
    tabindex="0"
    on:keydown={handleKeyDown}
    class="box"
    class:invalid
    data-geometry-box
    style="--zone: {color ?? '#6b7aff'}; grid-column: {box.x +
      1} / span {box.w}; grid-row: {box.y + 1} / span {box.h};"
    on:pointerdown={handleMoveStart}
  >
    <div
      role="presentation"
      class="corner nw"
      on:pointerdown={(e) => handleCornerStart(e, false, false)}
    ></div>
    <div
      role="presentation"
      class="corner ne"
      on:pointerdown={(e) => handleCornerStart(e, true, false)}
    ></div>
    <div
      role="presentation"
      class="corner sw"
      on:pointerdown={(e) => handleCornerStart(e, false, true)}
    ></div>
    <div
      role="presentation"
      class="corner se"
      on:pointerdown={(e) => handleCornerStart(e, true, true)}
    ></div>
  </div>
</div>

<style>
  .pad {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(9, 1fr);
    width: 100%;
    max-width: 24rem;
    aspect-ratio: 1;
    align-self: center;
    border: 1px solid color-mix(in srgb, var(--foreground) 40%, transparent);
    touch-action: none;
    user-select: none;
  }
  /* each cell has its own spot, so the box doesn't push cells into new rows */
  .cell {
    border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
  }
  .box {
    position: relative;
    z-index: 2;
    border: 2px solid var(--zone);
    background-color: color-mix(in srgb, var(--zone) 35%, transparent);
    cursor: move;
  }
  /* another zone: dimmer, and the pointer goes through it to the pad */
  .other {
    z-index: 1;
    pointer-events: none;
    border: 1px solid color-mix(in srgb, var(--zone) 60%, transparent);
    background-color: color-mix(in srgb, var(--zone) 18%, transparent);
  }
  .box.invalid {
    border-color: var(--error, #ef4444);
    background-color: color-mix(
      in srgb,
      var(--error, #ef4444) 30%,
      transparent
    );
  }
  .other.selectable {
    pointer-events: auto;
    cursor: pointer;
  }
  .other.selectable:hover {
    background-color: color-mix(in srgb, var(--zone) 35%, transparent);
  }
  .box:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--foreground);
  }
  /* the corners show only while the zone has the focus */
  .corner {
    display: none;
    position: absolute;
    width: 0.6rem;
    height: 0.6rem;
    background-color: var(--foreground);
  }
  .box:focus .corner {
    display: block;
  }
  .nw {
    top: -0.3rem;
    left: -0.3rem;
    cursor: nwse-resize;
  }
  .ne {
    top: -0.3rem;
    right: -0.3rem;
    cursor: nesw-resize;
  }
  .sw {
    bottom: -0.3rem;
    left: -0.3rem;
    cursor: nesw-resize;
  }
  .se {
    right: -0.3rem;
    bottom: -0.3rem;
    cursor: nwse-resize;
  }
</style>
