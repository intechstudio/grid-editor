import { derived } from "svelte/store";
import { selected_actions } from "../../../../runtime/user-input.store";
import {
  appClipboard,
  ClipboardData,
  ClipboardKey,
} from "../../../../runtime/clipboard.store";
import { ElementData } from "../../../../runtime/runtime";
import { runtime_manager } from "../../../../runtime/runtime-manager.store";

export const isCopyActionsEnabled = derived(
  selected_actions,
  ($selected_actions, set) => {
    // Create a derived store that reacts to each inner store
    const unsubscribers = $selected_actions.map((store) =>
      store.subscribe(() => {
        set(
          $selected_actions.length > 0 &&
            $selected_actions.every((e) => e.isValid())
        );
      })
    );

    // Initial computation
    set(
      $selected_actions.length > 0 &&
        $selected_actions.every((e) => e.isValid())
    );

    // Cleanup function
    return () => unsubscribers.forEach((unsub) => unsub());
  }
);
export const isCutActionsEnabled = derived(
  selected_actions,
  ($selected_actions, set) => {
    const unsubscribers = $selected_actions.map((store) =>
      store.subscribe(() => {
        set(
          $selected_actions.length > 0 &&
            $selected_actions.every((e) => e.isValid())
        );
      })
    );

    // Initial computation
    set(
      $selected_actions.length > 0 &&
        $selected_actions.every((e) => e.isValid())
    );

    // Cleanup function
    return () => unsubscribers.forEach((unsub) => unsub());
  }
);

export const isMergeActionsEnabled = derived(
  selected_actions,
  ($selected_actions, set) => {
    const unsubscribers = $selected_actions.map((store) =>
      store.subscribe(() => {
        set(
          $selected_actions.length > 0 &&
            $selected_actions.every((e) => e.isValid())
        );
      })
    );

    // Initial computation
    set(
      $selected_actions.length > 0 &&
        $selected_actions.every((e) => e.isValid())
    );

    // Cleanup function
    return () => unsubscribers.forEach((unsub) => unsub());
  }
);

export const isCopyElementEnabled = derived(
  [selected_actions, runtime_manager],
  ([$selected_actions, $runtime_manager], set) => {
    const active = $runtime_manager.active.runtime;

    const update = () => {
      set(
        $selected_actions.length === 0 &&
          active.modules.length > 0 &&
          active.isValid()
      );
    };

    const activeUnsub = active.subscribe ? active.subscribe(update) : null;

    update(); // Initial computation

    return () => {
      if (activeUnsub) activeUnsub();
    };
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
