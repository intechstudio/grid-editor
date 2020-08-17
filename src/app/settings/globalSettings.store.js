import { writable } from 'svelte/store';

export let globalSettings = writable({
  bankEnabled:[true,true,true,true], 
  colors: [[],[],[],[]],
  active: 0
})