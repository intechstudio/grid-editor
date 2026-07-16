import { writable } from "svelte/store";

const dirtyIds = new Set<string>();

export const codeBlockDirty = writable(false);

export function setCodeBlockDirty(id: string, dirty: boolean) {
  if (dirty) {
    dirtyIds.add(id);
  } else {
    dirtyIds.delete(id);
  }
  codeBlockDirty.set(dirtyIds.size > 0);
}
