import { get, writable, type Writable } from "svelte/store";
import { GridAction, GridEvent } from "../../runtime/runtime";
import { dropActions } from "../../runtime/operations";
import { selected_actions } from "../../runtime/selected-actions.store";

export const draggedActions: Writable<GridAction[]> = writable([]);
export type DropTarget = { event: GridEvent; index: number };
export const dropEventTarget: Writable<DropTarget> = writable();

function getTargetActions(action: GridAction): GridAction[] {
  const actions: GridAction[] = [];
  const event = action.parent as GridEvent;
  const selected = get(selected_actions);

  if (selected.includes(action)) {
    // Selection is present
    return event.config.filter((e) => selected.includes(e));
  } else {
    // Regular drag
    let index = event.config.findIndex((e) => e.id === action.id);
    let depth = 0;

    while (index < event.config.length) {
      const current = event.config[index];
      switch (current.information.type) {
        case "composite_open": {
          depth += 1;
          break;
        }
        case "composite_close": {
          depth -= 1;
          break;
        }
      }
      actions.push(current);
      ++index;
      if (depth <= 0) break;
    }
  }

  return actions;
}

function getTargetBlocks(actions: GridAction[]): HTMLElement[] {
  const dragged = actions
    .map((action) => document.querySelector(`[drag-id="${action.id}"]`))
    .filter((el): el is HTMLElement => el !== null);
  return dragged as HTMLElement[];
}

function createDragCursor(dragged: HTMLElement[]): HTMLElement {
  const cursor = document.createElement("div");
  cursor.id = "drag-n-drop-cursor";
  cursor.style.opacity = "0";
  cursor.style.position = "absolute";
  cursor.style.pointerEvents = "none";
  cursor.style.width = `${Math.max(...dragged.map((e) => e.clientWidth))}px`;
  cursor.style.zIndex = "9999";

  dragged.forEach((item) => {
    const copy = item.cloneNode(true) as HTMLElement;
    cursor.append(copy);
  });

  return cursor;
}

export type DragParameters = {
  action: GridAction;
  movable?: boolean;
  treshold?: number;
};

export function draggable(node: HTMLElement, params: DragParameters) {
  let cursor: HTMLElement = null;
  let threshold = params.treshold ?? 15;
  let initPos: { x: number; y: number };
  let isDragged = false;
  let targetBlocks: HTMLElement[] = [];
  let movable = params.movable ?? true;
  node.setAttribute("drag-id", params.action.id);

  node.addEventListener("mousedown", handleMouseDown);

  function handleDragStart(x: number, y: number) {
    isDragged = true;
    const actions = getTargetActions(params.action);
    selected_actions.set([]);
    draggedActions.set(actions);
    initPos = { x, y };
    cursor = createDragCursor(targetBlocks);
    document.body.append(cursor);
  }

  function handleDragEnd(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const dropZone = target.closest(".drop-zone");

    if (dropZone) {
      dropZone.dispatchEvent(
        new DropActionEvent({ dropped: get(draggedActions) }),
      );
    }

    isDragged = false;
    draggedActions.set([]);
    cursor.remove();
  }

  function handleMouseDown(e: MouseEvent) {
    // Left button only
    if (e.buttons !== 1 || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    const target = e.target as HTMLElement;
    if (target !== e.currentTarget) {
      return;
    }

    // Scrollbars are not DOM elements; the node itself is the event target.
    // Bail out if the click lands in the scrollbar region (beyond client area).
    if (e.offsetX > node.clientWidth || e.offsetY > node.clientHeight) {
      return;
    }

    if (!movable) {
      return;
    }

    const actions = getTargetActions(params.action);
    targetBlocks = getTargetBlocks(actions);

    for (const block of targetBlocks) {
      block.style.opacity = `0.5`;
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseUp(e: MouseEvent) {
    if (isDragged) {
      handleDragEnd(e);
    }

    for (const block of targetBlocks) {
      block.style.opacity = `1.0`;
    }
    targetBlocks = [];

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    // Left button only
    if (e.buttons !== 1 || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    if (isDragged) {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.opacity = `1`;

      const dx = Math.abs(e.clientX - initPos.x);
      const dy = Math.abs(e.clientY - initPos.y);

      // Use Euclidean distance or a weighted sum
      const distance = Math.sqrt(dx * dx + dy * dy); // Euclidean

      const normalized = Math.min(distance, threshold) / threshold;

      const opacity = 0.5 - normalized * 0.3;
      if (opacity < Number(targetBlocks[0].style.opacity)) {
        for (const block of targetBlocks) {
          block.style.opacity = `${0.5 - normalized * 0.3}`;
        }

        cursor.style.opacity = `${normalized === 1 ? "0.8" : "0"}`;
      }
    } else {
      handleDragStart(e.clientX, e.clientY);
    }
  }
}

export type DropParameters = {
  event: GridEvent;
  index: number;
  disabled?: boolean;
};

interface DropActionEventDetail {
  dropped: GridAction[];
}

// Create a custom DropActionEvent class that extends CustomEvent.
export class DropActionEvent extends CustomEvent<DropActionEventDetail> {
  constructor(detail: DropActionEventDetail) {
    super("drop-action", {
      detail,
      bubbles: true,
      cancelable: true,
    });
  }
}

export function dropzone(node: HTMLElement, params: DropParameters) {
  let disabled = params?.disabled ?? false;
  node.addEventListener("mouseover", handleMouseOver);
  node.addEventListener("mouseout", handleMouseOut);
  node.addEventListener("drop-action", handleDropAction);
  node.classList.add("drop-zone");

  function handleDropAction(e: DropActionEvent) {
    const { dropped } = e.detail;
    const { event, index } = params;
    dropActions(event, index, dropped).catch((e) => {
      console.warn(e);
    });
  }

  function handleMouseOver() {
    if (disabled) {
      return;
    }
    dropEventTarget.set({ event: params.event, index: params.index });
  }

  function handleMouseOut() {
    if (disabled) {
      return;
    }
    dropEventTarget.set(undefined);
  }
}
