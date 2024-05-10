import { tooltip_content } from "../user-interface/tooltip/tooltip-content.json";
import type { Action } from "svelte/action";

export const tooltip: Action<HTMLElement, any> = (
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

    const MoltenTooltip = (await import("@intechstudio/grid-uikit"))
      .MoltenTooltip;

    options.referenceElement = node;
    options.text = text;

    new MoltenTooltip({
      target: sibling,
      props: options,
    });
  };
  setTooltipAsync();
};
