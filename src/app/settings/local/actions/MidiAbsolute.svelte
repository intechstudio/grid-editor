<script>

  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  import DropDownInput from '../../ui/components/DropDownInput.svelte';
  import { GRID_PROTOCOL } from '../../../core/classes/GridProtocol.js';
  import { actionListChange } from '../action-list-change.store.js';
  import { configStore } from '../../../stores/config.store';
  import { check_for_matching_value, parameter_parser } from './action-helper';
  import { buildOptionList } from './parameter-map';

  export let action;
  export let index;
  export let eventInfo;
  export let elementInfo;

  let validator = [];

  let actionKeys = ['CABLECOMMAND','COMMANDCHANNEL','PARAM1','PARAM2'];
  
  let optionList = buildOptionList(elementInfo, eventInfo, action);

  let inputLabels = ['Channel', 'Command', 'Param 1','Param 2'];

  function validate_midiabsolute(PARAMETERS){

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {
        const VALUE = PARAMETERS[KEY];
        if(KEY == 'CABLECOMMAND'){
          if(parseInt(VALUE) >= 0 && parseInt(VALUE) <= 16){
            type = 'dec';
          } else {
            defined = 'invalid :(';
            //appears to be a wildcard
          }
        }
        else if(KEY == 'COMMANDCHANNEL'){
          console.log(VALUE, 'COMMANDCHANNEL')
          if(parseInt(VALUE) >= 128 && parseInt(VALUE) <= 255){
            type = 'dec';
            //let hexstring = '0x' + (+VALUE).toString(16).padStart(2, '0');      
            defined = check_for_matching_value(optionList, /**hexstring*/ VALUE, 1);
            //if(defined) optionList = MIDIABSOLUTE.optionList(hexstring);
          } else if(VALUE.toString().startsWith('0x') && VALUE.length > 3) {  
            type = 'hex';
            defined = check_for_matching_value(optionList, VALUE, 1);
          } else {
            defined = 'invalid :(';
            //appears to be a wildcard
          }
        }
        else if(KEY == 'PARAM1'){
          if(VALUE == 'P0' || VALUE == 'P1' || VALUE == 'B0' || VALUE == 'B1' || VALUE == 'E0' || VALUE == 'E1'){ 
            type = 'tmp param';
            defined = check_for_matching_value(optionList, VALUE, 2);  
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
            defined = check_for_matching_value(optionList, VALUE, 3);
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

    validate_midiabsolute(action.parameters)

    const CHANNEL = parseInt(action.parameters.CABLECOMMAND-1).toString(16).padStart(2,'0')[1]; // -1 on channel, beacuse it works 0..15
    const COMMAND = parseInt(action.parameters.COMMANDCHANNEL).toString(16)[0];
    
    const parameters = [
      {'CABLECOMMAND': `${'0'+COMMAND}` },
      {'COMMANDCHANNEL': `${COMMAND+CHANNEL}` },
      {'PARAM1': parameter_parser(action.parameters.PARAM1)},
      {'PARAM1': parameter_parser(action.parameters.PARAM2)}
    ];

    console.log(parameters);

    let valid = true;
 
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
      }
      c = 0;
    });

    const cablecommand = action.parameters.COMMANDCHANNEL % 16;
    const commandchannel = (action.parameters.CABLECOMMAND % 16) * 16;
    action.parameters.COMMANDCHANNEL = commandchannel;
    action.parameters.CABLECOMMAND = cablecommand + 1;
    validate_midiabsolute(action.parameters)
    
  })

  afterUpdate(() => {
    if(orderChangeTrigger){
      sendData('orderchange');
    }
  })



</script>


{#each actionKeys as actionKey, index}
  <div class={'w-1/'+actionKeys.length + ' dropDownInput'}>
    <div class="text-gray-700 text-xs">{inputLabels[index]}</div>
    <DropDownInput on:change={()=>{sendData()}} optionList={optionList[index]} bind:dropDownValue={action.parameters[actionKey]}/>
    <div class="text-white pl-2 text-xs tracking-wide flex-grow-0">
      {#if action.name == 'MIDI Static'}
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