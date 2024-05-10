import { writable, Writable } from "svelte/store";

export enum ClipboardKey {
  ELEMENT,
  ACTION_BLOCKS,
}

export interface ClipboardData {
  key: ClipboardKey;
  payload: any;
}

export const appClipboard: Writable<ClipboardData | undefined> =
  writable(undefined);
