import { writable, derived } from 'svelte/store';

export const bankActiveStore = writable({
  bankActive: 0
});

export const numberOfModulesStore = writable();

export const globalConfigReportStore = writable({
  bankEnabled:[true,true,true,true], 
  bankColors: [[255,0,0],[255,0,0],[255,0,0],[255,0,0]],
  bankNames:['','','',''],
});

export const localConfigReportStore = writable({
  cfgs: []
})

export const localInputStore = writable({
  id: "",
  dx: "",
  dy: "",
  elementNumber: -1, // should be checked out if grid sends back array or not
  eventParam: -1,
  eventType: 0
});

export const derivedInputStore = derived(
  [bankActiveStore, localInputStore], 
  ([$a, $b]) => Object.assign($a, $b)
);