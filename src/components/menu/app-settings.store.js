import { writable } from 'svelte/store';

export const appSettings = writable({size: 1.5, selectedDisplay: 'layout'});