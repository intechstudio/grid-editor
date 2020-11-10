<script>

  import {afterUpdate, beforeUpdate, createEventDispatcher, onMount} from 'svelte';

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
  let actionKeys = ['COMMANDCHANNEL','PARAM1','PARAM2']

  let optionList = buildOptionList(elementInfo, eventInfo, action);

  let inputLabels = ['Command','Param 1','Param 2'];

  function validate_midirelative(PARAMETERS){

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {
        const VALUE = PARAMETERS[KEY];
        if(KEY == 'COMMANDCHANNEL'){
          if(parseInt(VALUE) >= 128 && parseInt(VALUE) <= 255){
            type = 'dec';
            let hexstring = '0x' + (+VALUE).toString(16).padStart(2, '0');      
            defined = check_for_matching_value(optionList, hexstring, 0);
            //if(defined) optionList = MIDIRELATIVE.optionList(hexstring);
          } else if(VALUE.startsWith('0x') && parameter.length > 3) {  
            type = 'hex';
            defined = check_for_matching_value(optionList, VALUE, 0);
          } else {
            defined = 'invalid :(';
            //appears to be a wildcard,
          }
        }
        else if(KEY == 'PARAM1'){
          if(VALUE == 'P0' || VALUE == 'P1' || VALUE == 'B0' || VALUE == 'B1' || VALUE == 'E0' || VALUE == 'E1'){ 
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 1);  
          } else if(+VALUE >= 0 && +VALUE <= 127 && VALUE !== ''){
            type = 'dec';
          } else {
            // wildcard
            defined = 'invalid :('
          }
        }
        else if(KEY == 'PARAM2'){
          if(VALUE == 'P2' || VALUE == 'B2' || VALUE == 'B3' || VALUE == 'B4' || VALUE == 'E2' || VALUE == 'E5'){    
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 2);
          } else if(VALUE >= 0 && VALUE <= 127 && VALUE !== ''){
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


  function sendData(){

    const COMMAND = parseInt(action.parameters.COMMANDCHANNEL).toString(16)[0];

    validate_midirelative(action.parameters);

    console.log(action.parameters)
    
    const parameters = [
      {'CABLECOMMAND': `${'0'+COMMAND}` },
      {'COMMANDCHANNEL': `${COMMAND+'0'}` },
      {'PARAM1': parameter_parser(action.parameters.PARAM1)},
      {'PARAM2': parameter_parser(action.parameters.PARAM2)}
    ];

    let valid = true;
 
    for (const key in validator) {
      if(validator[key] == 'invalid :(' || validator[key] == undefined){
        valid = false
      }
    }

    console.log(parameters);
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

    validate_midirelative(action.parameters);

  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData();
    }
  })

</script>

{#each actionKeys as actionKey, index}
  <div class={'w-1/'+actionKeys.length + ' dropDownInput'}>
    <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
    <DropDownInput on:change={()=>{sendData()}} optionList={optionList[index]} bind:dropDownValue={action.parameters[actionKey]}/>
    <div class="text-white pl-2 text-xs font-light tracking-wide flex-grow-0">
      {#if action.name == 'MIDI Dynamic'}
        {#if validator[actionKey] == 'invalid :('} 
            <span class="text-important">Invalid parameter!</span>
        {:else}
            {validator[actionKey] ? validator[actionKey] : ''}
        {/if}
      {/if}
    </div>
  </div>
{/each}

<style>
  .dropDownInput{
    padding-right:0.5rem;
  }

  .dropDownInput:first-child{
    padding-left: 0rem;
  }

  .dropDownInput:last-child{
    padding-left: 0.5rem;
  }

  
</style>