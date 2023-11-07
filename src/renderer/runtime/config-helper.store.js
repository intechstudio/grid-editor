import { writable, get, derived } from "svelte/store";

export const selectedConfigStore = writable({});

export const isActionButtonClickedStore = writable(false);
