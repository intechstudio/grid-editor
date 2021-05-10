import { writable, get, derived } from 'svelte/store';
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

function isDropZoneAvailable(drop_target, isMultiDrag){
  if(isMultiDrag){
    if(drop_target < 0) drop_target += 1; // dont let negative drop target come into play
    const found = get(dropStore).find(index => index == drop_target);
    if(found){
      return 0;
    }
    return 1;
  } else {
    return 1;
  }
  
}

function createAppConfigManagement(){
  const store = writable();
  
  return {
    ...store,

    add: (index, config) => {
      _utils.gridLuaToEditorLua(config).then(res => {
        let configs = get(runtime);
        configs.splice(index, 0, ...res);      
        runtime.set(configs);
      })
    },

    reorder: (drag_target, drop_target, isMultiDrag) => {

      if(isDropZoneAvailable(drop_target, isMultiDrag)){
        let configs = get(runtime);
        let grabbed = [];
        drag_target.forEach(id => {
          grabbed.push(configs.find((act) => id === act.id));
        });
        const firstElem = configs.indexOf(grabbed[0]);
        const lastElem = configs.indexOf(grabbed[grabbed.length-1]);

        let to = Number(drop_target) + 1;
        // correction for multidrag
        if(to > firstElem){
          to = to - drag_target.length;
        }

        configs = [...configs.slice(0, firstElem), ...configs.slice(lastElem + 1)];
        configs = [...configs.slice(0, to), ...grabbed, ...configs.slice(to)];
        runtime.set(configs);
      };

    },

    copy: () => {

      const configs = get(runtime);
      const selection = get(appMultiSelect).selection;

      let clipboard = [];
      selection.forEach((elem,index) => {
        if(elem){
          clipboard.push(configs[index]);
        }
      });

      appActionClipboard.set(clipboard);

    },

    paste: (index) => {

      const clipboard = get(appActionClipboard);
      let configs = get(runtime);
      configs.splice(index, 0, ...clipboard);      
      //configs = genUniqueIds(configs);
      runtime.set(configs);

    },

    remove: (array) => {

      let configs = get(runtime);
      array.forEach(elem => {
        configs = configs.filter(a => a.id !== elem);
      });
      //configs = genUniqueIds(configs);
      runtime.set(configs);

    }
  }
}

export const appActionClipboard = writable();

export const runtime = createRuntimeStore();

export const appConfigManagement = createAppConfigManagement();

export const localInputStore = createlocalInputStore();

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

export const dropStore = derived(runtime, $runtime => {
  let disabled_blocks = [];
  let if_block = false;
  $runtime.forEach((a,index) => {
    // check if it's and if block
    if(a.component.name == 'If'){
      if_block = true;
    }

    // don't add +1 id in the array (end)
    if(if_block && a.component.name !== 'End'){
      disabled_blocks.push(index);
    }
    
    // this is the last, as END has to be disabled too!
    if (a.component.name == 'End'){
      if_block = false;
    }

  });
  return disabled_blocks;
});

export const derivedLocalInputStore = derived(
  [localInputStore],
  ([$a, $b]) => Object.assign($a, $b)
)


