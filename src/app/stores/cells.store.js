import { writable } from 'svelte/store';

export const cells = writable({
  used:[],
  layout:[]
});