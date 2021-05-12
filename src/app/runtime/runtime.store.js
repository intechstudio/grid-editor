import { writable, get, derived } from 'svelte/store';
import instructions from '../serialport/instructions';
import { configManagement } from './config-manager.store';
import _utils from './_utils';

function createRuntimeStore(){
  const store = writable([])
  return {
    ...store
  }
}

function createlocalInputStore() {

  const defaultValues = { 
    id: "",
    brc: {
      dx: "",
      dy: "",
      rot: ""
    },
    event: {
      pagenumber: 0,
      elementnumber: 4, // should be checked out if grid sends back array or not
      eventtype: 2
    }
  }

  // {...obj} syntax used to shallow copy default values. used to reset the store.
	const store = writable({...defaultValues});

	return {
    ...store,
    // This is used to re-init local settings panel if a module is removed which values have been displayed
		setToDefault: (removed = 'reset') => {
      
      const current = get(store);

      if(removed.dx == current.brc.dx && removed.dy == current.brc.dy){
        store.set({...defaultValues})
      }

      if(removed == 'reset'){
        store.set({...defaultValues});
      }
    }
	};
}
export const localInputStore = createlocalInputStore();

export const appActionClipboard = writable();

export const runtime = createRuntimeStore();

export const appMultiSelect = writable({multiselect: false, selection: []});

export const localDefinitions = derived(runtime, $runtime => {
  let locals = [];
  $runtime.forEach(a => {
    if(a.short == 'l'){
      // THIS IS A DUPLICATE, USED IN LOCALS TOO!
      let arr = [];
      const text = a.script.split('local');
      text.forEach(element => {
        if(element !== ''){
          const _split = element.split('=');
          arr.push({value: element, info: _split[0].trim()});
        }
      });
      locals.push(...arr);
    }
  });
  return locals;
})

export const derivedLocalInputStore = derived(
  [localInputStore],
  ([$a]) => Object.assign($a))

function _rtUpdate(){
  const store = writable(0);

  return {
    ...store,
    count: () => store.update(n => n + 1)
  }
}

export const rtUpdate = _rtUpdate();

export const activeConfiguration = derived([localInputStore, rtUpdate], ([$li, $rtu]) => {
  
    const _runtime = get(runtime);

    let config = [];

    console.log($rtu);
  
    _runtime.forEach(device => {
  
      if(device.dx == $li.brc.dx && device.dy == $li.brc.dy){
        let _event = device.pages[$li.event.pagenumber][$li.event.elementnumber].events.find(e => e.event.value == $li.event.eventtype);
        console.log(_event)
          if(_event.config.length){
            config = _event.config.trim();
  
            console.log('Config is available!');
          } else {
  
            instructions.fetchConfigFromGrid({device: device, inputStore: $li});
          
            console.log('Config Fetched!');
          }
  
      }
    });
  
    return config;
  
});