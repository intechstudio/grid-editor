import type { Action } from "svelte/action";

// What counts as interactive: a right click on it keeps the browser's or the
// element's own behaviour. Pickers and pads are plain divs, so they mark
// themselves with `data-interactive`.
const INTERACTIVE = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "canvas",
  ".monaco-editor",
  "[contenteditable]",
  "[data-interactive]",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']",
  "[role='slider']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='option']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='textbox']",
  "[role='spinbutton']",
  "[role='menuitem']",
].join(",");

// Put it before `use:contextTarget` on the same node: it stops a right click
// that lands on an interactive element (inside the node) before the context
// menu sees it, so the menu opens only on the node's background. An element
// inside that has a context menu of its own marks itself with
// `data-context-menu`: the right click reaches it.
export const interactiveContextMenu: Action<HTMLElement> = (node) => {
  const handle = (e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element) || target === node) {
      return;
    }
    // an element with a context menu of its own (data-context-menu) gets the
    // event, so its menu opens
    const own = target.closest("[data-context-menu]");
    if (own !== null && own !== node && node.contains(own)) {
      return;
    }
    const interactive = target.closest(INTERACTIVE);
    if (
      interactive !== null &&
      interactive !== node &&
      node.contains(interactive)
    ) {
      e.stopPropagation();
    }
  };

  // capture: it runs on the way down, before the menu's own listener
  node.addEventListener("contextmenu", handle, true);
  return {
    destroy() {
      node.removeEventListener("contextmenu", handle, true);
    },
  };
};
