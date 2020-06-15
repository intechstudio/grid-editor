import { writable } from 'svelte/store';

export const cells = writable([{
  //init cell
  id: 'none',
  coords: { 
    x: 0, 
    y:0
  } 
}]);
