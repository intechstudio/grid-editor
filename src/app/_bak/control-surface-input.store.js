import { writable, derived, get } from 'svelte/store';

export const bankActiveStore = writable({
  bankActive: 0
});

export const bankColorStore = writable({
  bankColors: [[255,0,0],[255,0,0],[255,0,0],[255,0,0]]
});

export const numberOfModulesStore = writable();



export const localConfigReportStore = writable({
  cfgs: []
})

export const localInputEventParamStore = writable({
  eventParam: -1,
});

export const hidKeyStatusStore = writable({
  isEnabled: 1
})


export const derivedInputStore = derived(
  [bankActiveStore, localInputStore], 
  ([$a, $b]) => Object.assign($a, $b)
);