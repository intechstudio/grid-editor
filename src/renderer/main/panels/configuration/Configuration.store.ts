import {
  derived,
  get,
  type Writable,
  writable,
  type Readable,
} from "svelte/store";

import { runtime, user_input } from "../../../runtime/runtime.store";
import { GridAction, GridEvent } from "../../../runtime/runtime";

export let lastOpenedActionblocks = writable([]);

export function lastOpenedActionblocksInsert(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set([
    ...currentList.filter((e) => e !== short),
    short,
  ]);
}

export function lastOpenedActionblocksRemove(short) {
  // Get the current value of lastOpenedActionblocks
  const currentList = get(lastOpenedActionblocks);

  // Update the store with the new value
  lastOpenedActionblocks.set(currentList.filter((e) => e !== short));
}

export type ActionBlock = {
  action: GridAction;
  selected: boolean;
};

// Derive a readable store from user_input
export const user_input_event: Readable<GridEvent | undefined> = derived(
  [user_input, runtime],
  ([$user_input, $runtime], set) => {
    const event = runtime.findEvent(
      $user_input.dx,
      $user_input.dy,
      $user_input.pagenumber,
      $user_input.elementnumber,
      $user_input.eventtype
    );

    if (typeof event === "undefined") {
      set(undefined);
      return;
    }

    // Load the event and set it
    event
      .load()
      .then(() => {
        set(event);
      })
      .catch((err) => {
        console.error("Failed to load event:", err);
        set(undefined); // Handle loading error by setting undefined
      });
  }
);

// Create a writable store for ActionBlock[]
export const config_panel_blocks: Writable<ActionBlock[]> = create_store();

function create_store() {
  const internal: Writable<ActionBlock[]> = writable([]);

  // Subscribe to user_input_event changes
  user_input_event.subscribe((event) => {
    console.log("Event updated:", event);

    const value =
      event?.config.map((e) => {
        return { action: e, selected: false } as ActionBlock;
      }) || []; // Fallback to an empty array if event is undefined

    // Update the internal writable store
    internal.set(value);
  });

  return internal;
}
