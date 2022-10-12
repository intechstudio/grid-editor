import { writable } from "svelte/store";

export const navigation = writable({
  rightPanel: 'Configuration',
  leftPanel: 'Profiles',
})