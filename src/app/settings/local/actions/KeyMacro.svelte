<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

  const dispatch = createEventDispatcher();

  import { actionListChange } from '../action-list-change.store.js';

  import DropDownInput from '../../ui/components/DropDownInput.svelte';
  import Toggle from '../../ui/components/Toggle.svelte';
  import Radio from '../../ui/components/Radio.svelte';

  import { check_for_matching_value, parameter_parser } from './action-helper';

  import * as keyMap from '../../../../external/macro/map.json';

  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];

  function sendData(){

      dispatch('send', { 
        action: {
          value: action.value, 
          parameters: parameters
        }, 
        index: index 
      });
    

  }

  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;
    actionListChange.subscribe((change)=>{
      c++;
      if(change !== null && c == 1){
        orderChangeTrigger = true;
        if(change == 'remove'){
          //configStore.remove(index, moduleInfo, eventInfo, inputStore);
        }
      }
      c = 0;
    });

    loadMacros()
    //validate_macrokeyboard(action.parameters);
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
  })

  let keys = '';
  let macro = [];
  let parameters = [];

  function identifyKey(e){
    let key = keyMap.default.find(key => key.js_value == e.keyCode);
    if(key){
      macro.push(key);
      keys = '';
      macro.forEach(key => 
        keys += key.info + '  '
      )
      manageMacro();
    }
  }

  function clearMacro(){
    macro = [];
    keys = '';
    manageMacro();
  }

  function loadMacros(){

    // parseInt('0xff')

    macro = [];
    keys = '';

    for (const objKey in action.parameters) {
      if(objKey.startsWith('KEYCODE')){
        console.log(action.parameters['KEYISMODIFIER'+objKey.slice(-1)], objKey.slice(-1))
        let found = keyMap.default.find(key => parseInt(key.value) == action.parameters[objKey] && key.is_modifier == action.parameters['KEYISMODIFIER'+objKey.slice(-1)]);
        if(found) {
          macro.push(found);
        }
      }
    }

    console.log(macro);

    macro.forEach(key => 
      keys += key.info + '  '
    )

    //manageMacro();
  }

  function manageMacro(){
    parameters = [];

    for (let i = 0; i < 6; i++) {
      
      const key = macro[i];

      const keyIsModifier = 'KEYISMODIFIER' + (i);
      const keyCode = 'KEYCODE' + (i);

      let obj = {};

      if(key){
        let modifier = 0;
        key.is_modifier ?  modifier = 1 : modifier = 0 ;

        obj[keyIsModifier] = parameter_parser(modifier);
        obj[keyCode] = parameter_parser(key.value)

        parameters.push(obj);
      } else {
        obj[keyIsModifier] = parameter_parser(0);
        obj[keyCode] = parameter_parser(255);
        parameters.push(obj);
      }
    }
    console.log(parameters);
    sendData();

  }

</script>


<div class="flex w-full flex-col">
  <div class="w-full flex flex-row items-end">
    <div class="w-full pr-2">
      <div class="text-gray-700 text-xs">Key Type</div>
      <input class="w-full secondary text-white p-1 pl-2 rounded-none focus:outline-none" bind:value={keys} on:keydown|preventDefault={identifyKey} >
    </div>
    <button on:click={clearMacro} class="bg-secondary hover:bg-highlight-400 text-white px-2 py-1 cursor-pointer border-none rounded focus:outline-none mr-2" >Clear</button>
  </div>
</div>

<style>

  
</style>