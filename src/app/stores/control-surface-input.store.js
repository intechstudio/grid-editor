import { writable, derived, get } from 'svelte/store';

export const bankActiveStore = writable({
  bankActive: 0
});

export const bankColorStore = writable({
  bankColors: [[255,0,0],[255,0,0],[255,0,0],[255,0,0]]
});

export const numberOfModulesStore = writable();

export const globalConfigReportStore = writable({
  bankEnabled: [true,true,true,true], 
  bankColors: [[255,0,0],[255,0,0],[255,0,0],[255,0,0]],
  bankNames: ['','','',''],
  isVirtual: true
});

export const localConfigReportStore = writable({
  cfgs: []
})

function createlocalInputStore() {

  const defaultValues = { 
    id: "",
    dx: "",
    dy: "",
    elementNumber: -1, // should be checked out if grid sends back array or not
    eventType: 0
  }

  // {...obj} syntax used to shallow copy default values. used to reset the store.
	const store = writable({...defaultValues});

	return {
    ...store,
    // This is used to re-init local settings panel if a module is removed which values have been displayed
		setToDefault: (removed = 'reset') => {

      const current = get(store);

      if(removed.dx == current.dx && removed.dy == current.dy){
        store.set({...defaultValues})
      }

      if(removed == 'reset'){
        store.set({...defaultValues});
      }
    }
	};
}

export const localInputStore = createlocalInputStore();

export const localInputEventParamStore = writable({
  eventParam: -1,
});

export const hidKeyStatusStore = writable({
  isEnabled: 1
})

export const derivedLocalInputStore = derived(
  [localInputStore, localInputEventParamStore],
  ([$a, $b]) => Object.assign($a, $b)
)

export const derivedInputStore = derived(
  [bankActiveStore, localInputStore], 
  ([$a, $b]) => Object.assign($a, $b)
);