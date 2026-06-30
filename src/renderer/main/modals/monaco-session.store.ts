import { writable } from "svelte/store";
import type { GridAction } from "../../runtime/runtime";

// Tracks the currently-open Monaco code editor so that opening a different
// code block can decide whether it is safe to auto-close-and-replace it
// (issue #1390, part 1). Only one Monaco editor can be open at a time.
export type MonacoSession = {
  // Unique per editor instance, used to guard the onDestroy cleanup against
  // a stale instance clearing the session after a newer one registered.
  token: object;
  // The action currently being edited.
  action: GridAction;
  // True while the editor has unsaved changes or an error ("needs committing").
  // Kept live by the editor so subscribers react as the user types.
  dirty: boolean;
  // Closes the editor's modal window.
  close: () => void;
};

export const activeMonacoSession = writable<MonacoSession | null>(null);
