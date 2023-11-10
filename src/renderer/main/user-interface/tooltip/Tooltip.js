import { tooltip_content } from "./tooltip-content.json.js";

export async function setTooltip(node, options) {
  if (typeof options === "undefined") {
    return;
  }

  let text = "";
  if (typeof options.key !== "undefined") {
    text = tooltip_content[options.key];
  } else if (typeof options.text !== "undefined") {
    text = options.text;
  }
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

export async function setPopover(node, options) {
  if (typeof options === "undefined") {
    return;
  }

  const sibling = document.createElement("div");
  node.parentNode.insertBefore(sibling, node.nextSibling);

  const Tooltip = (await import("./Tooltip.svelte")).default;

  options.referenceElement = node;

  new Tooltip({
    target: sibling,
    props: options,
  });
}
