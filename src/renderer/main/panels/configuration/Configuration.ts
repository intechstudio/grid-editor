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
  user_input,
  ($user_input, set) => {
    const event = runtime.findEvent(
      $user_input.dx,
      $user_input.dy,
      $user_input.pagenumber,
      $user_input.elementnumber,
      $user_input.eventtype
    );

    if (typeof event === "undefined") {
      return;
    }

    if (event.isLoaded()) {
      set(event);
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
    return;
  }
);

// Create a writable store for ActionBlock[]
export const config_panel_blocks: Writable<ActionBlock[]> = create_store();

function create_store() {
  const internal: Writable<ActionBlock[]> = writable([]);
  let unsubscribeInner: (() => void) | null = null; // To track the inner store subscription

  // Subscribe to the outer store (user_input_event)
  user_input_event.subscribe((eventStore) => {
    // Unsubscribe from the previous inner store if it exists
    if (unsubscribeInner) {
      unsubscribeInner();
      unsubscribeInner = null;
    }

    // Check if eventStore is defined (which is a store itself)
    if (eventStore) {
      // Subscribe to the value of the inner store (eventStore)
      unsubscribeInner = eventStore.subscribe((event) => {
        if (!event) {
          internal.set([]); // Set to empty array if event is undefined
          return;
        }

        // Map event's config to ActionBlock[]
        const value = event.config.map(
          (e) =>
            ({
              action: e,
              selected: false,
            } as ActionBlock)
        );

        // Update the internal writable store with the new value
        internal.set(value);
      });
    } else {
      // If no inner store exists, reset the blocks
      internal.set([]);
    }
  });

  return internal;
}
