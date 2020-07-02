import { writable } from 'svelte/store';

export const grid = writable({
  used:[],
  layout:[]
});