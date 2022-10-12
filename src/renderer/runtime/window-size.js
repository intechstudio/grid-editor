import { writable } from "svelte/store";

// moved here, as main app-helper store file was just waaay to big for importing
export const windowSize = writable({
  rightSidebarWidth: 0,
  leftSidebarWidth: 0,
  windowWidth: 0,
  windowHeight: 0,
});