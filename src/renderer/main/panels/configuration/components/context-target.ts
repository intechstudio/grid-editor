import type { Action } from "svelte/action";
import ContextMenu, { ContextMenuItem } from "./ContextMenu.svelte";
import { Writable, writable, get } from "svelte/store";

interface ContextMenuOptions {
  items: ContextMenuItem[];
  data: any;
}

export let contextMenu: Writable<
  { component: HTMLElement; data?: any } | undefined
> = writable();

export const contextTarget: Action<HTMLElement, ContextMenuOptions> = (
  node: HTMLElement,
  options: ContextMenuOptions
): any => {
  const handleMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      createContextMenu(e.offsetX, e.offsetY);
    }
  };

  const handleBlur = (e: any) => {
    const data = get(contextMenu);
    if (typeof data === "undefined") {
      return;
    }
    data!.component.parentNode?.removeChild(data!.component);
    contextMenu.set(undefined);
  };

  const createContextMenu = async (x: number, y: number) => {
    const menu = document.createElement("div");
    document.body.appendChild(menu);
    contextMenu.set({ component: menu, data: options.data });

    new ContextMenu({
      target: menu,
      props: {
        target: node,
        items: options.items,
        offset: { x: x, y: y },
      },
    });

    node.addEventListener("blur", handleBlur);
    node.focus();
  };
  node.addEventListener("mouseup", (event) => handleMouseUp(event));

  return {
    destroy() {
      node.removeEventListener("mouseup", handleMouseUp);
    },
  };
};
