import { writable, get, derived } from "svelte/store";

export const selectedProfileStore = writable({});

export const isActionButtonClickedStore = writable(false);
