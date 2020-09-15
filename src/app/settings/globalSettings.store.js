import { writable } from 'svelte/store';

export let globalSettings = writable({
  bankEnabled:[true,true,true,true], 
  colors: [[255,0,0],[255,0,0],[255,0,0],[255,0,0]],
  names:['','','',''],
  active: 0
})