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
    brc: {
      dx: "0",
      dy: "0",
      rot: "0"
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
    appUserChangeEvent: ({key, value}) => {
      store.update(s => {s.event[key] = value; return s});
    },
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

export const conditionalConfigPlacement = writable();

export const appMultiSelect = writable({multiselect: false, selection: []});

export const derivedLocalInputStore = derived(
  [localInputStore],
  ([$a]) => Object.assign($a))

function _rtUpdate(){
  const store = writable(0);

  return {
    ...store,
    count: () => store.update(n => n + 1),
    reset: () => store.set(0)
  }
}

export const rtUpdate = _rtUpdate();

export const activeConfiguration = derived([localInputStore, rtUpdate], ([$li, $rtu]) => {
  
    const _runtime = get(runtime);

    let config = [];
    let events = [];
    let elementNumbers = [];
    let selectedNumber = "";
    let selectedEvent = "";
  
    _runtime.forEach(device => {
  
      if(device.dx == $li.brc.dx && device.dy == $li.brc.dy){
      
        selectedNumber = $li.event.elementnumber;
        elementNumbers = device.pages[$li.event.pagenumber] 
        events = elementNumbers[selectedNumber].events;
        selectedEvent = events.find(e => e.event.value == $li.event.eventtype);

        if(selectedEvent.config.length){
          config = selectedEvent.config.trim();
          console.info('Config is available!');
        } else {
          instructions.fetchConfigFromGrid({device: device, inputStore: $li});     
          console.info('Config Fetched!');
        }
      }
    });
  
    return {
      config: config, 
      events: {
        selected: selectedEvent.event, 
        options: events.map(e => e.event)
      }, 
      elements: {
        selected: selectedNumber,
        options: elementNumbers.map((n,i) => i)
      }
    };
  
});

function createShowLocalDefinitions(){
  
  const store = writable();

  return {
    ...store,
    update: (configs) => {
      let locals = [];
      configs.forEach(c => {
        if(c.short == 'l'){
          let arr = [];
          const text = c.script.split('local');
          text.forEach(element => {
            if(element !== ''){
              const _split = element.split('=');
              arr.push({value: _split[0].trim(), info: _split[0].trim()});
            }
          });
          locals.push(...arr);
        }
      });
      store.set(locals);
    }
  }
}

export const localDefinitions = createShowLocalDefinitions();