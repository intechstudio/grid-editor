import { tooltip_content } from "./tooltip-content.json.js";
import type { Action } from "svelte/action";

export const setTooltip: Action<HTMLElement, any> = (
  node: HTMLElement,
  options: any
): void => {
  if (typeof options === "undefined") {
    return;
  }

  const setTooltipAsync = async () => {
    let text: string = "";
    if (typeof options.key !== "undefined") {
      text = tooltip_content[options.key];
    } else if (typeof options.text !== "undefined") {
      text = options.text;
    }
    const sibling = document.createElement("div");
    node.parentNode?.insertBefore(sibling, node.nextSibling);

    const Tooltip = (await import("./Tooltip.svelte")).default;

    options.referenceElement = node;
    options.text = text;

    new Tooltip({
      target: sibling,
      props: options,
    });
  };
  setTooltipAsync();
};
