import { MoltenTooltip } from "@intechstudio/grid-uikit";
import { tooltip_content } from "../user-interface/tooltip/tooltip-content.json";
import type { Action } from "svelte/action";

export const tooltip: Action<HTMLElement, any> = (
  node: HTMLElement,
  options: any
): any => {
  if (typeof options === "undefined") {
    return;
  }

  let text: string = "";
  if (typeof options.key !== "undefined") {
    text = tooltip_content[options.key];
  } else if (typeof options.text !== "undefined") {
    text = options.text;
  }
  const sibling = document.createElement("div");
  node.parentNode?.insertBefore(sibling, node.nextSibling);

  options.referenceElement = node;
  options.text = text;

  setTimeout(() => {
    new MoltenTooltip({ target: sibling, props: options });
  });
  return {
    destroy() {
      sibling.remove();
    },
  };
};
