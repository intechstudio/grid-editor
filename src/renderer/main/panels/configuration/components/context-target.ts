import type { Action } from "svelte/action";
import ContextMenu, { ContextMenuItem } from "./ContextMenu.svelte";

interface ContextMenuOptions {
  items: ContextMenuItem[];
}

let contextMenu: HTMLElement | undefined = undefined;

export const contextTarget: Action<HTMLElement, ContextMenuOptions> = (
  node: HTMLElement,
  options: ContextMenuOptions
): any => {
  const handleMouseUp = (e: MouseEvent) => {
    if (typeof contextMenu !== "undefined") {
      contextMenu!.parentNode?.removeChild(contextMenu);
      contextMenu = undefined;
    }
    if (e.button === 2) {
      createContextMenu(e.offsetX, e.offsetY);
    }
  };

  const createContextMenu = async (x: number, y: number) => {
    contextMenu = document.createElement("div");
    contextMenu.style.zIndex = "9999"; // Set the desired z-index here
    document.body.appendChild(contextMenu);

    new ContextMenu({
      target: contextMenu,
      props: {
        target: node,
        items: options.items,
        offset: { x: x, y: y },
      },
    });
  };
  node.addEventListener("mouseup", (event) => handleMouseUp(event));

  return {
    destroy() {
      node.removeEventListener("mouseup", handleMouseUp);
    },
  };
};
