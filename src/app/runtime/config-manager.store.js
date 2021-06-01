import { writable, get, derived } from 'svelte/store';

import {runtime, appMultiSelect, appActionClipboard} from './runtime.store';

import _utils from './_utils.js';


function get_configs () {
  let configs = '';
  const unsubscribe = runtime.active_lua(config => {
    configs = _utils.rawLuaToConfigList(config);
    let arr = [];
    for (let i = 0; i < configs.length; i+=2) {
      arr.push(`${configs[i]}${configs[i+1]}`.trim())
    }
    configs = arr;
  });
  unsubscribe();
  return configs;
}

export function configManagement() {

  const drag_and_drop = function(){

      this.add = async ({configs, index, newConfig}) => {
        return await _utils.gridLuaToEditorLua(newConfig).then(res => {
          configs.splice(index, 0, ...res);  
          return configs;    
        })
      };

      this.remove = ({configs, array}) => {
        array.forEach(elem => {
          configs = configs.filter(a => a.id !== elem);
        });
        return configs;
      };

      this.reorder = ({configs, drag_target, drop_target, isMultiDrag}) => {

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

        if(isDropZoneAvailable(drop_target, isMultiDrag)){
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
        };

        return configs;

      };

  }
  
  const on_click = function() {

    this.select_all = function() {
      const configs = get_configs();
      appMultiSelect.update((s)=>{
        s.all_selected = ! s.all_selected;
        s.selection = configs.map(v => s.all_selected);
        return s
      })
    };

    this.copy = function() {
      const selection = get(appMultiSelect).selection;
      
      const configs = get_configs();

      let clipboard = [];

      selection.forEach((elem,index) => {
        if(elem){
          clipboard.push(configs[index]);
        }
      });

      appActionClipboard.set(clipboard);
    };

    this.cut = function() {
      this.copy();
      this.remove();
    };

    this.remove = function() {
      const configs = get_configs();
      const selection = get(appMultiSelect).selection;
      const filtered = configs.filter((city,index) => selection[index] !== true);
      runtime.update.status('EDITOR_EXECUTE').config({lua: filtered.join('')}).sendToGrid().trigger();
    };
  }

  return {
    drag_and_drop: new drag_and_drop(),
    on_click: new on_click()
  }
};

function createDropStore(){
  
  const store = writable([]);

  return {
    ...store,
    update: (configs) => {
      let disabled_blocks = [];
      let if_block = false;
      configs.forEach((a,index) => {
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

      store.set(disabled_blocks);

    }
  }
}

export const dropStore = createDropStore();