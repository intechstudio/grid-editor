import { derived } from "svelte/store";
import { selected_actions } from "../../../../runtime/user-input.store";
import {
  appClipboard,
  ClipboardData,
  ClipboardKey,
} from "../../../../runtime/clipboard.store";
import { ElementData } from "../../../../runtime/runtime";
import { runtime_manager } from "../../../../runtime/runtime-manager.store";

export const isCutActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return (
      $selected_actions.length > 0 &&
      $selected_actions.every((e) => e.checkSyntax())
    );
  }
);

export const isCopyElementEnabled = derived(
  [selected_actions, runtime_manager],
  ([$selected_actions, $runtime_manager]) => {
    const active = $runtime_manager.active.runtime;
    return (
      $selected_actions.length === 0 &&
      active.modules.length > 0 &&
      active.checkSyntax()
    );
  }
);

export const isCopyActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return (
      $selected_actions.length > 0 &&
      $selected_actions.every((e) => e.checkSyntax())
    );
  }
);

export const isMergeActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return (
      $selected_actions.length > 0 &&
      $selected_actions.every((e) => e.checkSyntax())
    );
  }
);

export const isPasteActionsEnabled = derived(appClipboard, ($appClipboard) => {
  return $appClipboard?.key === ClipboardKey.ACTION_BLOCKS;
});

export const isRemoveActionsEnabled = derived(
  selected_actions,
  ($selected_actions) => {
    return $selected_actions.length > 0;
  }
);

export function isClearElementEnabled(data: ElementData) {
  return typeof data !== "undefined";
}

export function isOverwriteElementEnabled(
  data: ElementData,
  clipboard: ClipboardData
) {
  if (typeof clipboard === "undefined" || typeof data === "undefined") {
    return false;
  }

  return (
    clipboard.key === ClipboardKey.ELEMENT &&
    data.isCompatible((clipboard.payload as ElementData).type)
  );
}

export function isDiscardElementEnabled(data: ElementData) {
  if (typeof data === "undefined") {
    return false;
  }

  return data.hasChanges();
}
