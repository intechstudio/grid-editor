import { writable, Writable } from "svelte/store";

export namespace ProfileLoadOverlay {
  export enum State {
    READY,
    BUSY,
    LOADED,
    ERROR,
  }

  export const state: Writable<State> = writable(State.READY);
}
