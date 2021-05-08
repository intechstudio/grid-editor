import { writable, get, derived } from 'svelte/store';
import { dropStore } from '../app/stores/app-helper.store';
import _utils from './_utils';

function createRuntimeStore(){
  const store = writable([])

  return {
    ...store
  }
}

export const runtime = createRuntimeStore();

export const selectedControlElement = writable('encoder');

export const appMultiSelect = writable({multiselect: false, selection: []});

export const appActionClipboard = writable();

function genUniqueIds(configs){

  let _temp_actions = [];
  configs.forEach((a,i) => {
    let _a = Object.assign({}, a); // need to mutate, else it wont be changed.
    _a.id = i;
    _temp_actions.push(_a)
  });
  return _temp_actions;
}

function isDropZoneAvailable(drop_target){
  if(drop_target < 0) drop_target += 1; // dont let negative drop target come into play
  const target_index = get(runtime).indexOf(drop_target);
  const found = get(dropStore).disabledDropZones.find(index => index == target_index);
  if(found){
    return 0;
  }
  return 1
}

function createAppConfigManagement(){
  const store = writable();
  
  return {
    ...store,

    add: (index, config) => {
      _utils.gridLuaToEditorLua(config).then(res => {
        let configs = get(runtime);
        configs.splice(index, 0, ...res);      
        //configs = genUniqueIds(configs);
        console.log(configs)

        runtime.set(configs);
      })
    },

    reorder: (drag_target, drop_target) => {

      if(isDropZoneAvailable(drop_target)){
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
        //configs = genUniqueIds(configs);
        console.log(configs);
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
      configs = genUniqueIds(configs);
      runtime.set(configs);

    },

    remove: (array) => {

      let configs = get(runtime);
      array.forEach(elem => {
        configs = configs.filter(a => a.id !== Number(elem));
      });
      configs = genUniqueIds(configs);
      runtime.set(configs);

    }
  }
}

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



export const appConfigManagement = createAppConfigManagement();
