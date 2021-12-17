import { writable, get } from 'svelte/store';

import {runtime, luadebug_store, appMultiSelect, appActionClipboard, user_input} from './runtime.store';


import { analytics_track_string_event } from '../main/_stores/app-helper.store';

import _utils from './_utils.js';


function get_configs () {
  let configs = '';
  const unsubscribe = luadebug_store.subscribe(data => {

    let arr = [];
    configs = _utils.rawLuaToConfigList(data.config);
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

      this.add = ({configs, index, newConfig}) => {
        
        let res = _utils.gridLuaToEditorLua(newConfig)

        if (res === undefined){
          console.log("NO CONFIG PASSED")
          return undefined;
        }

        configs.splice(index, 0, ...res);  
        return configs;    
        
      };

      this.remove = ({configs, array}) => {
        array.forEach(elem => {
          configs = configs.filter(a => a.id !== elem);
        });
        return configs;
      };

      this.reorder = ({configs, drag_target, drop_target, isMultiDrag}) => {

        function isDropZoneAvailable(drop_target, isMultiDrag){
          return 1;
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

    this.copy = function(isCut = false) {

      const selection = get(appMultiSelect).selection;
      
      const configs = get_configs();

      let clipboard = [];

      selection.forEach((elem,index) => {
        if(elem){
          clipboard.push(configs[index]);
        }
      });

      appActionClipboard.set(clipboard);
      
      if (isCut === false){
        analytics_track_string_event("config", "multiselect", "copy")
      }

    };

    this.paste = function(){
      if(get(appActionClipboard).length){
        const configs = [...get_configs(), ...get(appActionClipboard)];

        const li = get(user_input);

        const dx = li.brc.dx;
        const dy = li.brc.dy;
        const page =  li.event.pagenumber;
        const element = li.event.elementnumber;
        const event = li.event.eventtype;
        const actionstring = '<?lua ' + configs.join('') + ' ?>'
  
        runtime.update_event_configuration(dx, dy, page, element, event, actionstring, 'EDITOR_EXECUTE');
        runtime.send_event_configuration_to_grid(dx, dy, page, element, event);            
        
        // trigger change detection
        user_input.update(n => n);

        analytics_track_string_event("config", "multiselect", "paste")
      }
    }

    this.cut = function() {
      analytics_track_string_event("config", "multiselect", "cut")
      this.copy(true);
      this.remove();
    };

    this.remove = function() {

      const selection = get(appMultiSelect).selection;

      if(selection.length){

        const configs = [...get_configs()];

        let filtered = [];

        for (let i = 0; i < configs.length; i++) {
          if(selection[i] !== true){
            filtered.push(configs[i]);
          } else {
            // dont return
          }
        }

        const li = get(user_input);

        const dx = li.brc.dx;
        const dy = li.brc.dy;
        const page =  li.event.pagenumber;
        const element = li.event.elementnumber;
        const event = li.event.eventtype;
        const actionstring = '<?lua ' + filtered.join('') + ' ?>'
    
        runtime.update_event_configuration(dx, dy, page, element, event, actionstring, 'EDITOR_EXECUTE');
        runtime.send_event_configuration_to_grid(dx, dy, page, element, event);

        // trigger change detection
        user_input.update(n => n);

        analytics_track_string_event("config", "multiselect", "remove")

      }

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
        if(a.information.name == 'If'){
          if_block = true;
        }
    
        // don't add +1 id in the array (end)
        if(if_block && a.information.name !== 'End'){
          disabled_blocks.push(index);
        }
        
        // this is the last, as END has to be disabled too!
        if (a.information.name == 'End'){
          if_block = false;
        }
      });

      store.set(disabled_blocks);

    }
  }
}

export const dropStore = createDropStore();