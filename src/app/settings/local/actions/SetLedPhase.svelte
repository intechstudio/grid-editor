<script>
  import { onMount, createEventDispatcher, afterUpdate } from 'svelte';

  const dispatch = createEventDispatcher();

  import { actionListChange } from '../action-list-change.store.js';

  import DropDownInput from '../../ui/components/DropDownInput.svelte';

  import { check_for_matching_value, parameter_parser } from './action-helper';
  import { buildOptionList } from './parameter-map';


  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];

  let optionList = buildOptionList(elementInfo, eventInfo, action);
  
  let orderChangeTrigger = null;
  onMount(()=>{
    let c = 0;
    actionListChange.subscribe((change)=>{
      c++;
      //console.log( action.name, 'order change subscription', index);
      if(change !== null && c == 1){
        orderChangeTrigger = true;
      }
      c = 0;
    });
    validate_setledphase(action.parameters);
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
  })
  
  function sendData(){

    validate_setledphase(action.parameters);

    let param_0;
    let param_2;
    if(action.parameters.NUM != 'A0' && action.parameters.NUM != 'A1'){ param_0 = action.parameters.NUM } else { param_0 = action.parameters.NUM}
    if(action.parameters.PHA != 'A3' && action.parameters.PHA != 'A7'){ param_2 = action.parameters.PHA } else { param_2 = action.parameters.PHA}
    const parameters = [
      { 'NUM': parameter_parser(param_0) },
      { 'LAY': `${'0'+action.parameters.LAY}` },
      { 'PHA': parameter_parser(param_2) },
    ];

    let valid = true;

 
    for (const key in validator) {
      if(validator[key] == 'invalid :(' || validator[key] == undefined){
        valid = false
      }
    }

    
     

    if(valid){    
      dispatch('send',{
        action: {
          value: action.value, 
          parameters: parameters
        }, 
        index: index 
      });
    }
  }


  function validate_setledphase(PARAMETERS){

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {
        const VALUE = PARAMETERS[KEY];

        if(KEY == 'NUM'){
          if(VALUE == 'B0' || VALUE == 'B1' || VALUE == 'E0' || VALUE == 'E1' || VALUE == 'P0' || VALUE == 'P1'){ 
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 0);  
          } else if(+VALUE >= 0 && +VALUE <= 15){
            type = 'dec';
          } else {
            // wildcard
            defined = 'invalid :('
          }
        } 
        else if(KEY == 'LAY'){
          if(VALUE == 1 || VALUE == 2){ 
            defined = check_for_matching_value(optionList, VALUE, 1); 
          } else {
            defined = 'invalid :(';
          }
        } 
        else if(KEY == 'PHA'){
          if(VALUE == 'P2' || VALUE == 'B2' || VALUE == 'B3' || VALUE == 'B4' || VALUE == 'E2' ||  VALUE == 'E3' || VALUE == 'E4'  || VALUE == 'E5' || VALUE == 'E6' || VALUE == 'E7'){ 
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 2);  
          } else if(parseInt(VALUE) >= 0 && parseInt(VALUE) <= 255){
            type = 'dec';
          } else {
            // wildcard
            defined = 'invalid :('
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

</script>

<div class="flex flex-col w-full pr-1 ">
  <div class="flex w-full text-white">
    <div class="w-1/3 pr-1">
      <div class="text-gray-700 text-xs">Element</div>
      <DropDownInput optionList={optionList[0]} on:change={()=>{sendData()}} bind:dropDownValue={action.parameters.NUM}/>
      <div class="text-white text-xs tracking-wide pl-2 flex-grow-0">
        {#if validator.NUM == 'invalid :('} 
          <span class="text-important">Invalid parameter!</span>
        {:else}
          {validator.NUM ? validator.NUM : ''}
        {/if}
      </div>
    </div>

    <div class=" w-1/3">
      <div class="px-1">
        <div class="text-gray-700 text-xs">Layer</div>
        <DropDownInput optionList={optionList[1]} on:change={()=>{sendData()}} bind:dropDownValue={action.parameters.LAY}/>
        <div class="text-white text-xs tracking-wide pl-2 flex-grow-0">
          {#if validator.LAY == 'invalid :('} 
            <span class="text-important">Invalid parameter!</span>
          {:else}
            {validator.LAY ? validator.LAY : ''}
          {/if}
        </div>
      </div>
    </div>

    <div class="flex w-1/3">
      <div class="px-1">
        <div class="text-gray-700 text-xs">Intensity</div>
        <DropDownInput optionList={optionList[2]} on:change={()=>{sendData()}} bind:dropDownValue={action.parameters.PHA}/>
        <div class="text-white pl-2 text-xs tracking-wide flex-grow-0">
          {#if validator.PHA == 'invalid :('} 
            <span class="text-important">Invalid parameter!</span>
          {:else}
            {validator.PHA ? validator.PHA : ''}
          {/if}
        </div>
      </div>
    </div>
  </div>

</div>