import { MoltenTooltip } from "@intechstudio/grid-uikit";
import { mount, unmount } from "svelte";
import { get } from "svelte/store";
import { tooltip_content } from "../user-interface/tooltip/tooltip-content.json.js";
import { appSettings } from "../../runtime/app-helper.store";
import { reduced_motion_store } from "../../runtime/animations";
import type { Action } from "svelte/action";

export const tooltip: Action<HTMLElement, any> = (
  node: HTMLElement,
  options: any,
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
  // MoltenTooltip's `instant` prop skips its fade-in entirely, but nothing
  // was wiring it to the "Disable Animations" preference (or OS-level
  // reduced motion) — same rule MoltenModal.svelte/ActionList.svelte use,
  // applied here once so every use:tooltip call site gets it for free.
  // A caller that explicitly sets `instant` keeps that value.
  if (typeof options.instant === "undefined") {
    const disableAnimations = get(appSettings).persistent.disableAnimations;
    options.instant =
      disableAnimations === "disabled" ||
      (disableAnimations !== "enabled" && get(reduced_motion_store));
  }

  let instance: any = null;

  setTimeout(() => {
    instance = mount(MoltenTooltip, { target: sibling, props: options });
  });
  return {
    destroy() {
      if (instance) {
        unmount(instance);
        instance = null;
      }
      sibling.remove();
    },
  };
};
