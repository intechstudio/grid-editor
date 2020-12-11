<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

  const dispatch = createEventDispatcher();

  import { actionListChange } from '../action-list-change.store.js';

  import DropDownInput from '../../ui/components/DropDownInput.svelte';
  import Radio from '../../ui/components/Radio.svelte';

  import { check_for_matching_value, parameter_parser } from './action-helper';

  import { buildOptionList } from './parameter-map';

  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];

  let optionList = buildOptionList(elementInfo, eventInfo, action, action.parameters.KEYISMODIFIER );

  $: {
    optionList = buildOptionList(elementInfo, eventInfo, action, action.parameters.KEYISMODIFIER ); 
  }

  function validate_hidkeyboard(PARAMETERS){

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {

        const VALUE = PARAMETERS[KEY];
        
        if(KEY == 'KEYCODE'){
          if(parseInt(VALUE) >= 0 && parseInt(VALUE) <= 255){ 
            type = 'key';
            console.log(optionList, VALUE, 0);
            defined = check_for_matching_value(optionList, VALUE, 0);  
          } else {
            // wildcard
            defined = 'invalid :('
          }
        } 
        else {
          console.log('ELSE', parseInt(VALUE))
          if(parseInt(VALUE) == 0 || parseInt(VALUE) == 1) {
            defined = 'valid!';
          } else {
            defined = 'invalid :(';
          }
      }

        if(defined)
          humanReadable = defined
        else 
          humanReadable = VALUE;
        
        validator[KEY] = humanReadable;

      }
        
    }
  }
  


  function sendData(){

    validate_hidkeyboard(action.parameters);
    
    const parameters = [
      {'KEYISMODIFIER': parameter_parser(action.parameters.KEYISMODIFIER) },
      {'KEYCODE': parameter_parser(action.parameters.KEYCODE) },
      {'KEYSTATE': parameter_parser(action.parameters.KEYSTATE)},
    ];

    let valid = true;

    console.log('sendData',validator);
 
    for (const key in validator) {
      if(validator[key] == 'invalid :(' || validator[key] == undefined){
        valid = false
      }
    }

    if(valid){
      dispatch('send', { 
        action: {
          value: action.value, 
          parameters: parameters
        }, 
        index: index 
      });
    }
  
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

    validate_hidkeyboard(action.parameters);

  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
})

</script>



<div class="w-4/12 ui-field ">
  <div class="text-gray-700 text-xs">Key Type</div>
  <Radio on:change={()=>{sendData()}} pairs={[{key:'Modifier', value: 1}, {key:'Key', value: 0}]} bind:radioValue={action.parameters.KEYISMODIFIER}/>
</div>

<div class="w-4/12 ui-field">
  <div class="text-gray-700 text-xs">Key Code</div>
  <div class="w-full flex items-center pr-2">
    <div class="w-1/2 flex relative">
      <DropDownInput on:change={()=>{sendData()}} optionList={optionList[0]} bind:dropDownValue={action.parameters.KEYCODE}/>
    </div>
    <div class="w-1/2 text-white pl-2 text-xs tracking-wide ">
      {#if validator['KEYCODE'] == 'invalid :('} 
        <span class="text-important">Invalid parameter!</span>
      {:else}
        {validator['KEYCODE'] ? validator['KEYCODE'] : ''}
      {/if}
    </div>
  </div>
</div>

<div class="w-4/12 ui-field">
<div class="text-gray-700 text-xs">State</div>
  <Radio on:change={()=>{sendData()}} pairs={[{key:'Press', value: 1}, {key:'Release', value: 0}]} bind:radioValue={action.parameters.KEYSTATE}/>
</div>

<style>

  .ui-field{
    padding-right:0.5rem;
  }

  .ui-field:first-child{
    padding-left: 0rem;
  }

  .ui-field:last-child{
    padding-left: 0.5rem;
  }
  
</style>