<script>

  import {onMount, beforeUpdate, afterUpdate, createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  import DropDownInput from '../../ui/components/DropDownInput.svelte';

  import { GRID_PROTOCOL } from '../../../core/classes/GridProtocol.js';

  import { actionListChange } from '../action-list-change.store.js';

  import { configStore } from '../../../stores/config.store';

  import { check_for_matching_value, parameter_parser } from './action-helper';

  export let action;
  export let index;
  export let eventInfo;

  let validator = [];
  let actionKeys = ['CABLECOMMAND','COMMANDCHANNEL','PARAM1','PARAM2'];

  $: {
    optionList = MIDIABSOLUTE.optionList(action.parameters.COMMANDCHANNEL);
  }


  const build_array = () => {
    let arr = [];
    for (let i = 0; i < 16; i++) {
      arr[i] = {value: Number(i+1).toString(), info: `${'Ch. ' + Number(i+1)}`}
    }
    return arr;
  }
  
  const MIDIABSOLUTE = {

    PARAMS: ['Channel', 'Command', 'Parameter 1','Parameter 2'],

    CC_digital: [
      build_array(),
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'Control Number'}, 
        {value: 'A1', info: 'Reversed Control Number'}
      ],[
        {value: 'A6', info: 'Control Value'}
      ]
    ],
    NOTE_digital: [
      build_array(),
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'Note'}, 
        {value: 'A1', info: 'Reversed Note'}
      ],
      [
        {value: 'A6', info: 'Velocity'}
      ],
    ],
    CC_analog: [
      build_array(),
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'Control Number'}, 
        {value: 'A1', info: 'Reversed Control Number'}
      ],[
        {value: 'A2', info: 'Control Value'}
      ]
    ],
    NOTE_analog: [
      build_array(),
      [
        {value: '0xb0', info: 'Control Change'}, 
        {value: '0x90', info: 'Note On'}, 
        {value: '0x80', info: 'Note Off'}
      ],
      [
        {value: 'A0', info: 'Note'}, 
        {value: 'A1', info: 'Reversed Note'}
      ],
      [
        {value: 'A2', info: 'Velocity'}
      ],
    ],

    optionList: function(parameter){
      let options = [];
      if(parameter == '176'){
        if(eventInfo.code[0] == 'A'){
          options = this.CC_analog;
        }else {
          options = this.CC_digital;
        }
      }else{ // this is also the default;
        if(eventInfo.code[0] == 'A'){
          options = this.NOTE_analog;
        } else {
          options = this.NOTE_digital;
        }
      }
      inputLabels = this.PARAMS;
      return options;
    }
  
  }

  let optionList = [];

  let inputLabels = MIDIABSOLUTE.PARAMS;

  function validate_midiabsolute(PARAMETERS){

    for (const KEY in PARAMETERS) {
      let type = '';
      let defined = '';
      let humanReadable = '';
      if (PARAMETERS.hasOwnProperty(KEY)) {
        const VALUE = PARAMETERS[KEY];
        if(KEY == 'CABLECOMMAND'){
          if(parseInt(VALUE) >= 0 && parseInt(VALUE) <= 15){
            type = 'dec';
          } else {
            defined = 'invalid :(';
            //appears to be a wildcard
          }
        }
        else if(KEY == 'COMMANDCHANNEL'){
          if(parseInt(VALUE) >= 128 && parseInt(VALUE) <= 255){
            type = 'dec';
            let hexstring = '0x' + (+VALUE).toString(16).padStart(2, '0');      
            defined = check_for_matching_value(optionList, hexstring, 1);
            if(defined) optionList = MIDIABSOLUTE.optionList(hexstring);
          } else if(VALUE.startsWith('0x') && parameter.length > 3) {  
            type = 'hex';
            defined = check_for_matching_value(optionList, VALUE, 1);
          } else {
            defined = 'invalid :(';
            //appears to be a wildcard
          }
        }
        else if(KEY == 'PARAM1'){
          if(VALUE == 'A0' || VALUE == 'A1'){ 
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
          if(VALUE == 'A2' || VALUE == 'A6'){    
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
    
    console.log('command',COMMAND, CHANNEL);

    const parameters = [
      {'CABLECOMMAND': `${'0'+COMMAND}` },
      {'COMMANDCHANNEL': `${COMMAND+CHANNEL}` },
      {'PARAM1': parameter_parser(action.parameters.PARAM1)},
      {'PARAM1': parameter_parser(action.parameters.PARAM2)}
    ];

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
    <div class="text-white pl-2 flex-grow-0">
      {#if action.name == 'MIDI Static'}
        {validator[actionKey] ? validator[actionKey] : ''}
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