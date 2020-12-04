<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

  const dispatch = createEventDispatcher();

  import { actionListChange } from '../action-list-change.store.js';

  import DropDownInput from '../../ui/components/DropDownInput.svelte';
  import Toggle from '../../ui/components/Toggle.svelte';
  import Radio from '../../ui/components/Radio.svelte';

  import { check_for_matching_value, parameter_parser } from './action-helper';

  import { buildOptionList } from './parameter-map';

  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];

  let actionKeys = [
    {id: 0, KEYCODE: 'KEYCODE_1', ISMODIFIER: 'ISMODIFIER_1'},
    {id: 1, KEYCODE: 'KEYCODE_2', ISMODIFIER: 'ISMODIFIER_2'},
    {id: 2, KEYCODE: 'KEYCODE_3', ISMODIFIER: 'ISMODIFIER_3'},
    {id: 3, KEYCODE: 'KEYCODE_4', ISMODIFIER: 'ISMODIFIER_4'},
    {id: 4, KEYCODE: 'KEYCODE_5', ISMODIFIER: 'ISMODIFIER_5'},
    {id: 5, KEYCODE: 'KEYCODE_6', ISMODIFIER: 'ISMODIFIER_6'},
  ]

  let optionList = buildExtendedOptionList();

  $: {
    optionList = buildExtendedOptionList(); 
    console.log(optionList, action.parameters);
  }

  function buildExtendedOptionList(){
    let list = [];
    actionKeys.forEach((key,i) => {
      console.log('ismodifier?',action)
      list[i] = buildOptionList(elementInfo, eventInfo, action, action.parameters[key.ISMODIFIER]) ;
    })
    console.log(list);
    return list;
  }

  function validate_macrokeyboard(PARAMETERS){

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {

        const VALUE = PARAMETERS[KEY];
        
        if(KEY.startsWith('KEYCODE')){
          if(parseInt(VALUE) >= 0 && parseInt(VALUE) <= 255){ 
            type = 'key';
            defined = check_for_matching_value(optionList[KEY.slice(-1)], VALUE, 0);  
          } else {
            // wildcard
            defined = 'invalid :('
          }
        }

        else if(KEY.startsWith('ISMODIFIER')){
          if(parseInt(VALUE) == 0 || parseInt(VALUE) == 1){
            defined = 'valid';
          } else {
            // wildcard
            defined == 'invalid :(';
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

    validate_macrokeyboard(action.parameters);
    
    const parameters = [
      {'KEYCODE1': parameter_parser(action.parameters.KEYCODE1)},
      {'KEYCODE2': parameter_parser(action.parameters.KEYCODE2)},
      {'KEYCODE3': parameter_parser(action.parameters.KEYCODE3)},
      {'KEYCODE4': parameter_parser(action.parameters.KEYCODE4)},
      {'KEYCODE5': parameter_parser(action.parameters.KEYCODE5)},
      {'KEYCODE6': parameter_parser(action.parameters.KEYCODE6)},
    ];

    let valid = true;
 
    for (const key in validator) {
      if(validator[key] == 'invalid :(' || validator[key] == undefined){
        valid = false
      }
    }
/**
    if(valid){
      dispatch('send', { 
        action: {
          value: action.value, 
          parameters: parameters
        }, 
        index: index 
      });
    }
  */
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

    validate_macrokeyboard(action.parameters);

  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
})

</script>


<div class="flex w-full flex-col">
  <div class="w-full flex flex-row items-end">
    <div class="w-1/3 pr-2">
      <div class="text-gray-700 text-xs">Key Type</div>
    </div>
    <div class="w-2/3 flex items-center pr-2">
      <div class="w-1/2 flex relative">
        <div class="text-gray-700 text-xs">Key Code</div>
      </div>
    </div>
  </div>
  {#each actionKeys as actionKey, index} 
    <div class="w-full flex flex-row items-end pb-2">
      <div class="w-1/3 pr-2">
        <div class="text-gray-700 text-xs hidden">Key Type</div>
        <Radio on:change={()=>{sendData()}} pairs={[{key:'Modifier', value: 1}, {key:'Key', value: 0}]} bind:radioValue={action.parameters[actionKey.ISMODIFIER]}/>
      </div>
      <div class="w-2/3 flex items-center pr-2">
        <div class="w-1/2 flex relative">
          <div class="text-gray-700 text-xs hidden">Key Code</div>
          <DropDownInput on:change={()=>{sendData()}} optionList={optionList[index][0]} bind:dropDownValue={action.parameters[actionKey.KEYCODE]}/>
        </div>
        <div class="w-1/2 text-white pl-2 text-xs tracking-wide ">
          {#if validator[actionKey.KEYCODE] == 'invalid :('} 
            <span class="text-important">Invalid parameter!</span>
          {:else}
            {validator[actionKey.KEYCODE] ? validator[actionKey.KEYCODE] : ''}
          {/if}
        </div>
      </div>
    </div> 
  {/each}
</div>

<style>

  
</style>