import {writable, get, derived} from 'svelte/store';

function createRuntimeStore(){
  const store = writable([])

  return {
    ...store,
  }
}

export const runtime = createRuntimeStore();

export const selectedControlElement = writable('encoder');

export const appMultiSelect = writable({multiselect: false, selection: []});

export const appActionClipboard = writable();


function createAppActionManagement(){
  const store = writable();

  function genUniqueIds(actions){

    let _temp_actions = [];
    actions.forEach((a,i) => {
      let _a = Object.assign({}, a); // need to mutate, else it wont be changed.
      _a.id = i;
      console.log(_a.id);
      _temp_actions.push(_a)
    });
    console.log(_temp_actions);
    return _temp_actions;
  }
  
  return {
    ...store,
    copy: () => {

      const actions = get(runtime);
      const selection = get(appMultiSelect).selection;

      console.log(selection);

      let clipboard = [];
      selection.forEach((elem,index) => {
        if(elem){
          clipboard.push(actions[index]);
        }
      });

      appActionClipboard.set(clipboard);
      console.log(clipboard);
    },

    paste: (index) => {

      const clipboard = get(appActionClipboard);
      let actions = get(runtime);
      actions.splice(index, 0, ...clipboard);      
      actions = genUniqueIds(actions);
      runtime.set(actions);
    },

    remove: (array) => {
      let actions = get(runtime);
      array.forEach(elem => {
        actions = actions.filter(a => a.id !== Number(elem));
      });
      actions = genUniqueIds(actions);
      runtime.set(actions);
    }
  }
}

export const localDefinitions = derived(runtime, $runtime => {
  let locals = [];
  $runtime.forEach(a => {
    if(a.code == 'locals'){
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



export const appActionManagement = createAppActionManagement();
