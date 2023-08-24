import { tooltip_content } from "./tooltip-content.json.js";

export async function setTooltip(node, options) {
  const text = tooltip_content[options.key];
  const sibling = document.createElement("div");
  node.parentNode.insertBefore(sibling, node.nextSibling);

  const Tooltip = (await import("./Tooltip.svelte")).default;

  options.referenceElement = node;
  options.text = text;

  new Tooltip({
    target: sibling,
    props: options,
  });
}
